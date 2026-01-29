/**
 * Скрипт для проверки подключения к Supabase
 * Запуск: node connect-supabase.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Проверка подключения к базе данных...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Установлен' : '❌ Не установлен');
    
    if (!process.env.DATABASE_URL) {
      console.error('\n❌ Ошибка: DATABASE_URL не установлен в .env файле');
      console.log('\n📝 Инструкция:');
      console.log('1. Откройте backend/.env');
      console.log('2. Добавьте строку:');
      console.log('   DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@db.XXXXX.supabase.co:5432/postgres?schema=public"');
      console.log('3. Замените ВАШ_ПАРОЛЬ и XXXXX на ваши данные из Supabase');
      process.exit(1);
    }

    // Попытка подключения
    await prisma.$connect();
    console.log('✅ Подключение к базе данных успешно!');
    
    // Проверка существования таблиц
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log(`\n📊 Найдено таблиц: ${tables.length}`);
    if (tables.length > 0) {
      console.log('Таблицы:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      console.log('⚠️  Таблицы не найдены. Необходимо применить миграции.');
      console.log('\n💡 Выполните:');
      console.log('   npx prisma migrate dev --name init');
    }
    
  } catch (error) {
    console.error('\n❌ Ошибка подключения:');
    console.error(error.message);
    
    if (error.message.includes('P1001')) {
      console.log('\n💡 Возможные причины:');
      console.log('  - Неправильный connection string');
      console.log('  - Неверный пароль');
      console.log('  - Проект Supabase приостановлен');
      console.log('  - Проблемы с сетью');
    } else if (error.message.includes('P1000')) {
      console.log('\n💡 База данных недоступна. Проверьте:');
      console.log('  - Правильность connection string');
      console.log('  - Что проект Supabase активен');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
