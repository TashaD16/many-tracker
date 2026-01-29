const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const where = { userId: req.user.id };
    if (type) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single category
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await prisma.category.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create category
router.post('/',
  auth,
  [
    body('name').trim().notEmpty(),
    body('type').isIn(['income', 'expense']),
    body('icon').optional().trim(),
    body('color').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, icon, color } = req.body;

      const category = await prisma.category.create({
        data: {
          userId: req.user.id,
          name,
          type,
          icon: icon || null,
          color: color || '#2196F3'
        }
      });

      res.status(201).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update category
router.put('/:id',
  auth,
  [
    body('name').optional().trim().notEmpty(),
    body('type').optional().isIn(['income', 'expense']),
    body('icon').optional().trim(),
    body('color').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const category = await prisma.category.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      const updatedCategory = await prisma.category.update({
        where: { id: req.params.id },
        data: req.body
      });

      res.json(updatedCategory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    const { reassignToCategoryId } = req.query;

    const category = await prisma.category.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        transactions: true
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.transactions.length > 0) {
      if (reassignToCategoryId) {
        const targetCategory = await prisma.category.findFirst({
          where: {
            id: reassignToCategoryId,
            userId: req.user.id
          }
        });

        if (!targetCategory) {
          return res.status(404).json({ message: 'Target category not found' });
        }

        await prisma.transaction.updateMany({
          where: { categoryId: req.params.id },
          data: { categoryId: reassignToCategoryId }
        });
      } else {
        return res.status(400).json({
          message: 'Category has transactions. Provide reassignToCategoryId or delete transactions first'
        });
      }
    }

    await prisma.category.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
