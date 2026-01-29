const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard data
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get all accounts
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.id }
    });

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    // Get transactions for period
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        category: true,
        account: true
      },
      orderBy: { date: 'desc' }
    });

    // Calculate income and expenses
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown for expenses
    const expenseCategories = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catId = t.categoryId;
        if (!expenseCategories[catId]) {
          expenseCategories[catId] = {
            category: t.category,
            amount: 0
          };
        }
        expenseCategories[catId].amount += t.amount;
      });

    // Category breakdown for income
    const incomeCategories = {};
    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const catId = t.categoryId;
        if (!incomeCategories[catId]) {
          incomeCategories[catId] = {
            category: t.category,
            amount: 0
          };
        }
        incomeCategories[catId].amount += t.amount;
      });

    // Recent transactions (last 10)
    const recentTransactions = transactions.slice(0, 10);

    // Budget progress
    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.user.id,
        periodStart: { lte: end },
        periodEnd: { gte: start }
      },
      include: {
        category: true
      }
    });

    const budgetProgress = await Promise.all(
      budgets.map(async (budget) => {
        const spentTransactions = await prisma.transaction.findMany({
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

        const spent = spentTransactions.reduce((sum, t) => sum + t.amount, 0);
        const percentage = (spent / budget.limit) * 100;

        return {
          ...budget,
          spent,
          percentage: Math.min(percentage, 100),
          remaining: Math.max(budget.limit - spent, 0)
        };
      })
    );

    res.json({
      totalBalance,
      income,
      expenses,
      netIncome: income - expenses,
      period: { start, end },
      expenseCategories: Object.values(expenseCategories),
      incomeCategories: Object.values(incomeCategories),
      recentTransactions,
      budgetProgress,
      accounts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
