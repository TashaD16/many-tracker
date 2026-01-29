const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all transfers
router.get('/', auth, async (req, res) => {
  try {
    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [
          { fromUserId: req.user.id },
          { toUserId: req.user.id }
        ]
      },
      include: {
        fromAccount: true,
        toAccount: true
      },
      orderBy: { date: 'desc' }
    });

    res.json(transfers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single transfer
router.get('/:id', auth, async (req, res) => {
  try {
    const transfer = await prisma.transfer.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { fromUserId: req.user.id },
          { toUserId: req.user.id }
        ]
      },
      include: {
        fromAccount: true,
        toAccount: true
      }
    });

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    res.json(transfer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create transfer
router.post('/',
  auth,
  [
    body('fromAccountId').notEmpty().withMessage('From account ID is required'),
    body('toAccountId').notEmpty().withMessage('To account ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0').toFloat(),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO8601 date'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fromAccountId, toAccountId, amount, date, description } = req.body;

      // Validate amount is positive
      if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than 0' });
      }

      if (fromAccountId === toAccountId) {
        return res.status(400).json({ message: 'Cannot transfer to the same account' });
      }

      // Verify accounts belong to user
      const [fromAccount, toAccount] = await Promise.all([
        prisma.account.findFirst({
          where: { id: fromAccountId, userId: req.user.id }
        }),
        prisma.account.findFirst({
          where: { id: toAccountId, userId: req.user.id }
        })
      ]);

      if (!fromAccount || !toAccount) {
        return res.status(404).json({ message: 'Account not found' });
      }

      if (fromAccount.currentBalance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      // Get or calculate exchange rate
      let exchangeRate = 1;
      let convertedAmount = amount;

      if (fromAccount.currency !== toAccount.currency) {
        const rate = await prisma.currencyRate.findFirst({
          where: {
            fromCurrency: fromAccount.currency,
            toCurrency: toAccount.currency
          },
          orderBy: { updatedAt: 'desc' }
        });

        if (rate) {
          exchangeRate = rate.rate;
          convertedAmount = amount * exchangeRate;
        } else {
          // Try reverse rate
          const reverseRate = await prisma.currencyRate.findFirst({
            where: {
              fromCurrency: toAccount.currency,
              toCurrency: fromAccount.currency
            },
            orderBy: { updatedAt: 'desc' }
          });

          if (reverseRate) {
            exchangeRate = 1 / reverseRate.rate;
            convertedAmount = amount * exchangeRate;
          }
        }
      }

      // Create transfer
      const transfer = await prisma.transfer.create({
        data: {
          fromUserId: req.user.id,
          toUserId: req.user.id,
          fromAccountId,
          toAccountId,
          amount,
          exchangeRate: fromAccount.currency !== toAccount.currency ? exchangeRate : null,
          date: date ? new Date(date) : new Date(),
          description
        },
        include: {
          fromAccount: true,
          toAccount: true
        }
      });

      // Update account balances
      await Promise.all([
        prisma.account.update({
          where: { id: fromAccountId },
          data: {
            currentBalance: {
              decrement: amount
            }
          }
        }),
        prisma.account.update({
          where: { id: toAccountId },
          data: {
            currentBalance: {
              increment: convertedAmount
            }
          }
        })
      ]);

      // Broadcast update
      if (req.app.locals.broadcastToUser) {
        req.app.locals.broadcastToUser(req.user.id, {
          type: 'transfer_created',
          data: transfer
        });
      }

      res.status(201).json(transfer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
