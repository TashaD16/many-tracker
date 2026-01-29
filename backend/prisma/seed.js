const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User'
    }
  });

  console.log('Created user:', user.email);

  // Create default categories
  const categories = [
    { name: 'Salary', type: 'income', color: '#4CAF50' },
    { name: 'Freelance', type: 'income', color: '#4CAF50' },
    { name: 'Investment', type: 'income', color: '#4CAF50' },
    { name: 'Food', type: 'expense', color: '#F44336' },
    { name: 'Utilities', type: 'expense', color: '#FF9800' },
    { name: 'Entertainment', type: 'expense', color: '#9C27B0' },
    { name: 'Transport', type: 'expense', color: '#2196F3' },
  ];

  for (const cat of categories) {
    await prisma.category.create({
      data: {
        ...cat,
        userId: user.id
      }
    });
  }

  console.log('Created default categories');

  // Create default accounts
  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Main Account',
      type: 'card',
      currency: 'BYN',
      initialBalance: 1000,
      currentBalance: 1000
    }
  });

  console.log('Created default account');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
