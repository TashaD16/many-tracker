const request = require('supertest');
const { app } = require('../server');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

let authToken;
let userId;

beforeAll(async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'test-accounts@example.com',
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
});

afterAll(async () => {
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('Account Routes', () => {
  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Account',
          type: 'card',
          currency: 'BYN',
          initialBalance: 1000
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Account');
      expect(res.body.currentBalance).toBe(1000);
    });

    it('should validate account type', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Account',
          type: 'invalid',
          currency: 'BYN'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/accounts', () => {
    it('should get all accounts', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
