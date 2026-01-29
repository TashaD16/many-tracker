# Быстрое подключение к Supabase

## Шаг 1: Получите Connection String из Supabase

1. Откройте https://supabase.com и войдите
2. Выберите ваш проект (или создайте новый)
3. Перейдите в **Settings** → **Database**
4. Найдите секцию **Connection string**
5. Выберите вкладку **URI**
6. Скопируйте connection string (пример):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   Или обычный URI:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

## Шаг 2: Обновите backend/.env

Откройте файл `backend/.env` и обновите `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@db.XXXXX.supabase.co:5432/postgres?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MYFIN_API_URL=https://api.myfin.by/bank/kursExchange
```

**Важно:**
- Замените `ВАШ_ПАРОЛЬ` на пароль от базы данных Supabase
- Замените `XXXXX` на ваш Project Reference (например, `abcdefghijklmnop`)
- Если используете Connection Pooling (порт 6543), добавьте `?pgbouncer=true&schema=public`

## Шаг 3: Проверьте подключение

```bash
cd backend
npm run db:check
```

Этот скрипт проверит подключение к базе данных и покажет существующие таблицы.

## Шаг 4: Примените миграции (создайте таблицы)

```bash
cd backend
npm run db:setup
```

Или пошагово:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Шаг 5: (Опционально) Заполните тестовыми данными

```bash
npm run seed
```

## Проверка в Supabase Studio

1. В панели Supabase перейдите в **Table Editor**
2. Вы должны увидеть созданные таблицы:
   - User
   - Account
   - Category
   - Transaction
   - Transfer
   - Budget
   - CurrencyRate

## Troubleshooting

### Ошибка: "Can't reach database server"
- Проверьте правильность connection string
- Убедитесь, что проект Supabase активен (не приостановлен)
- Проверьте пароль

### Ошибка: "P1001: Can't reach database server"
- Попробуйте использовать Connection Pooling (порт 6543)
- Или добавьте `?sslmode=require` в connection string

### Ошибка миграций
- Убедитесь, что используете правильный connection string
- Проверьте, что база данных пустая или используйте `npx prisma migrate reset` (осторожно!)

## Готово! ✅

После успешного подключения и применения миграций вы можете запустить сервер:

```bash
npm run dev
```
