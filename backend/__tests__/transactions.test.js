const request = require('supertest');
const { app } = require('../server');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

let authToken;
let userId;
let accountId;
let categoryId;

beforeAll(async () => {
  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'test-transactions@example.com',
      password: hashedPassword,
      name: 'Test User'
    }
  });
  userId = user.id;

  authToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '7d' }
  );

  // Create test account
  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Test Account',
      type: 'card',
      currency: 'BYN',
      initialBalance: 1000,
      currentBalance: 1000
    }
  });
  accountId = account.id;

  // Create test category
  const category = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Test Category',
      type: 'expense',
      color: '#F44336'
    }
  });
  categoryId = category.id;
});

afterAll(async () => {
  // Cleanup
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.category.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('Transaction Routes', () => {
  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId,
          categoryId,
          amount: 100,
          type: 'expense',
          description: 'Test transaction'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.amount).toBe(100);
      expect(res.body.type).toBe('expense');
    });

    it('should not create transaction without auth', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .send({
          accountId,
          categoryId,
          amount: 100,
          type: 'expense'
        });

      expect(res.statusCode).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/transactions', () => {
    it('should get all transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('transactions');
      expect(Array.isArray(res.body.transactions)).toBe(true);
    });

    it('should filter transactions by type', async () => {
      const res = await request(app)
        .get('/api/transactions?type=expense')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      res.body.transactions.forEach(t => {
        expect(t.type).toBe('expense');
      });
    });
  });
});
