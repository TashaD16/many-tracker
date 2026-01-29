const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all transactions with filters
router.get('/', auth,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional().isIn(['income', 'expense']),
    query('categoryId').optional(),
    query('accountId').optional(),
    query('sortBy').optional().isIn(['date', 'amount']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        startDate,
        endDate,
        type,
        categoryId,
        accountId,
        sortBy = 'date',
        sortOrder = 'desc',
        page = 1,
        limit = 50
      } = req.query;

      const where = { userId: req.user.id };

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      if (type) where.type = type;
      if (categoryId) where.categoryId = categoryId;
      if (accountId) where.accountId = accountId;

      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          account: true,
          category: true
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      });

      const total = await prisma.transaction.count({ where });

      res.json({
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get single transaction
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        account: true,
        category: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create transaction
router.post('/',
  auth,
  [
    body('accountId').notEmpty().withMessage('Account ID is required'),
    body('categoryId').notEmpty().withMessage('Category ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0').toFloat(),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO8601 date'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { accountId, categoryId, amount, type, date, description, tags = [] } = req.body;

      // Validate amount is positive
      if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than 0' });
      }

      // Verify account and category belong to user
      const [account, category] = await Promise.all([
        prisma.account.findFirst({
          where: { id: accountId, userId: req.user.id }
        }),
        prisma.category.findFirst({
          where: { id: categoryId, userId: req.user.id }
        })
      ]);

      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      const transaction = await prisma.transaction.create({
        data: {
          userId: req.user.id,
          accountId,
          categoryId,
          amount,
          type,
          date: date ? new Date(date) : new Date(),
          description,
          tags
        },
        include: {
          account: true,
          category: true
        }
      });

      // Update account balance
      const balanceChange = type === 'income' ? amount : -amount;
      await prisma.account.update({
        where: { id: accountId },
        data: {
          currentBalance: {
            increment: balanceChange
          }
        }
      });

      // Update budget if applicable
      if (type === 'expense') {
        const budgets = await prisma.budget.findMany({
          where: {
            userId: req.user.id,
            categoryId,
            periodStart: { lte: new Date(transaction.date) },
            periodEnd: { gte: new Date(transaction.date) }
          }
        });

        for (const budget of budgets) {
          await prisma.budget.update({
            where: { id: budget.id },
            data: {
              spent: {
                increment: amount
              }
            }
          });
        }
      }

      // Broadcast update via WebSocket
      if (req.app.locals.broadcastToUser) {
        req.app.locals.broadcastToUser(req.user.id, {
          type: 'transaction_created',
          data: transaction
        });
      }

      res.status(201).json(transaction);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update transaction
router.put('/:id',
  auth,
  [
    body('accountId').optional(),
    body('categoryId').optional(),
    body('amount').optional().isFloat({ min: 0.01 }).toFloat(),
    body('type').optional().isIn(['income', 'expense']),
    body('date').optional().isISO8601(),
    body('description').optional().trim(),
    body('tags').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const transaction = await prisma.transaction.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Handle account balance updates if amount or type changed
      if (req.body.amount !== undefined || req.body.type !== undefined) {
        const oldBalanceChange = transaction.type === 'income' 
          ? -transaction.amount 
          : transaction.amount;

        await prisma.account.update({
          where: { id: transaction.accountId },
          data: {
            currentBalance: {
              increment: oldBalanceChange
            }
          }
        });
      }

      const updateData = { ...req.body };
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          account: true,
          category: true
        }
      });

      // Update new account balance
      const newType = req.body.type || transaction.type;
      const newAmount = req.body.amount || transaction.amount;
      const newBalanceChange = newType === 'income' ? newAmount : -newAmount;

      const targetAccountId = req.body.accountId || transaction.accountId;
      await prisma.account.update({
        where: { id: targetAccountId },
        data: {
          currentBalance: {
            increment: newBalanceChange
          }
        }
      });

      // Broadcast update
      if (req.app.locals.broadcastToUser) {
        req.app.locals.broadcastToUser(req.user.id, {
          type: 'transaction_updated',
          data: updatedTransaction
        });
      }

      res.json(updatedTransaction);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Revert account balance
    const balanceChange = transaction.type === 'income' 
      ? -transaction.amount 
      : transaction.amount;

    await prisma.account.update({
      where: { id: transaction.accountId },
      data: {
        currentBalance: {
          increment: balanceChange
        }
      }
    });

    await prisma.transaction.delete({
      where: { id: req.params.id }
    });

    // Broadcast update
    if (req.app.locals.broadcastToUser) {
      req.app.locals.broadcastToUser(req.user.id, {
        type: 'transaction_deleted',
        data: { id: req.params.id }
      });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
