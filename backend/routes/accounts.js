const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all accounts
router.get('/', auth, async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single account
router.get('/:id', auth, async (req, res) => {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create account
router.post('/',
  auth,
  [
    body('name').trim().notEmpty(),
    body('type').isIn(['cash', 'card', 'savings', 'other']),
    body('currency').optional().isIn(['BYN', 'USD', 'EUR', 'RUB']),
    body('initialBalance').optional().isFloat({ min: 0 }).toFloat()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, currency = 'BYN', initialBalance = 0 } = req.body;

      const account = await prisma.account.create({
        data: {
          userId: req.user.id,
          name,
          type,
          currency,
          initialBalance,
          currentBalance: initialBalance
        }
      });

      res.status(201).json(account);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update account
router.put('/:id',
  auth,
  [
    body('name').optional().trim().notEmpty(),
    body('type').optional().isIn(['cash', 'card', 'savings', 'other']),
    body('currency').optional().isIn(['BYN', 'USD', 'EUR', 'RUB']),
    body('currentBalance').optional().isFloat().toFloat()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const account = await prisma.account.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const updatedAccount = await prisma.account.update({
        where: { id: req.params.id },
        data: req.body
      });

      res.json(updatedAccount);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete account
router.delete('/:id', auth, async (req, res) => {
  try {
    const { transferToAccountId } = req.query;

    const account = await prisma.account.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        transactions: true
      }
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.currentBalance !== 0) {
      if (transferToAccountId) {
        const targetAccount = await prisma.account.findFirst({
          where: {
            id: transferToAccountId,
            userId: req.user.id
          }
        });

        if (!targetAccount) {
          return res.status(404).json({ message: 'Target account not found' });
        }

        // Transfer balance (simplified - should handle currency conversion)
        await prisma.account.update({
          where: { id: transferToAccountId },
          data: {
            currentBalance: {
              increment: account.currentBalance
            }
          }
        });
      } else {
        return res.status(400).json({
          message: 'Account has balance. Provide transferToAccountId or empty the account first'
        });
      }
    }

    await prisma.account.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
