const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to calculate period dates
function getPeriodDates(period, referenceDate = new Date()) {
  const date = new Date(referenceDate);
  let start, end;

  switch (period) {
    case 'month':
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'quarter':
      const quarter = Math.floor(date.getMonth() / 3);
      start = new Date(date.getFullYear(), quarter * 3, 1);
      end = new Date(date.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      break;
    case 'year':
      start = new Date(date.getFullYear(), 0, 1);
      end = new Date(date.getFullYear(), 11, 31, 23, 59, 59);
      break;
    default:
      throw new Error('Invalid period');
  }

  return { start, end };
}

// Get all budgets
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id },
      include: {
        category: true
      },
      orderBy: { periodStart: 'desc' }
    });

    // Calculate spent amounts from transactions
    for (const budget of budgets) {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: req.user.id,
          categoryId: budget.categoryId,
          type: 'expense',
          date: {
            gte: budget.periodStart,
            lte: budget.periodEnd
          }
        }
      });

      const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
      budget.spent = spent;
    }

    res.json(budgets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single budget
router.get('/:id', auth, async (req, res) => {
  try {
    const budget = await prisma.budget.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        category: true
      }
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Calculate spent
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        categoryId: budget.categoryId,
        type: 'expense',
        date: {
          gte: budget.periodStart,
          lte: budget.periodEnd
        }
      }
    });

    budget.spent = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create budget
router.post('/',
  auth,
  [
    body('categoryId').notEmpty(),
    body('period').isIn(['month', 'quarter', 'year']),
    body('limit').isFloat({ min: 0.01 }).toFloat(),
    body('periodStart').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { categoryId, period, limit, periodStart } = req.body;

      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId: req.user.id,
          type: 'expense'
        }
      });

      if (!category) {
        return res.status(404).json({ message: 'Category not found or not an expense category' });
      }

      const { start, end } = getPeriodDates(period, periodStart ? new Date(periodStart) : new Date());

      const budget = await prisma.budget.create({
        data: {
          userId: req.user.id,
          categoryId,
          period,
          periodStart: start,
          periodEnd: end,
          limit
        },
        include: {
          category: true
        }
      });

      res.status(201).json(budget);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update budget
router.put('/:id',
  auth,
  [
    body('limit').optional().isFloat({ min: 0.01 }).toFloat(),
    body('period').optional().isIn(['month', 'quarter', 'year'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const budget = await prisma.budget.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });

      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }

      const updateData = { ...req.body };

      if (req.body.period) {
        const { start, end } = getPeriodDates(req.body.period);
        updateData.periodStart = start;
        updateData.periodEnd = end;
      }

      const updatedBudget = await prisma.budget.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          category: true
        }
      });

      res.json(updatedBudget);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await prisma.budget.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    await prisma.budget.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
