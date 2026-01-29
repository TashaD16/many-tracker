# Руководство по подключению к Supabase

## Разница между переменными окружения

### Для Frontend (если используете Supabase JS SDK):
- `VITE_SUPABASE_URL` - URL вашего Supabase проекта
- `VITE_SUPABASE_PUBLISHABLE_KEY` - публичный ключ (anon key)

### Для Backend (обязательно для Prisma):
- `DATABASE_URL` - прямой connection string к PostgreSQL базе данных

## Почему нужен DATABASE_URL?

В этом проекте backend использует **Prisma ORM**, который работает напрямую с PostgreSQL. Prisma не использует Supabase SDK, а подключается к базе данных через стандартный PostgreSQL connection string.

## Как получить DATABASE_URL из Supabase

### Шаг 1: Откройте панель Supabase
1. Перейдите на https://supabase.com
2. Войдите и выберите ваш проект

### Шаг 2: Получите Connection String
1. Перейдите в **Settings** → **Database**
2. Найдите секцию **Connection string**
3. Выберите вкладку **URI** (не Connection pooling)
4. Скопируйте connection string

Он будет выглядеть так:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Или обычный URI:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Шаг 3: Обновите backend/.env

Добавьте или обновите `DATABASE_URL` в файле `backend/.env`:

```env
# Обязательно для backend (Prisma)
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@db.XXXXX.supabase.co:5432/postgres?schema=public"

# Остальные переменные
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MYFIN_API_URL=https://api.myfin.by/bank/kursExchange

# Опционально для frontend (если будете использовать Supabase SDK)
VITE_SUPABASE_URL=https://XXXXX.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=ваш_публичный_ключ
```

**Важно:**
- Замените `ВАШ_ПАРОЛЬ` на пароль от базы данных (который вы установили при создании проекта)
- Замените `XXXXX` на ваш Project Reference (можно найти в URL проекта или в Settings → General)

### Шаг 4: Проверьте подключение

```bash
cd backend
npm install  # если еще не установлены зависимости
npm run db:check
```

### Шаг 5: Примените миграции

```bash
npm run db:setup
```

## Где найти Project Reference и пароль?

### Project Reference:
- В URL вашего проекта: `https://app.supabase.com/project/XXXXX`
- Или в Settings → General → Reference ID

### Пароль базы данных:
- Это пароль, который вы установили при создании проекта
- Если забыли, можно сбросить в Settings → Database → Database password

## Connection Pooling (опционально)

Для продакшена рекомендуется использовать Connection Pooling (порт 6543):

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
```

## Проверка подключения

После настройки `DATABASE_URL` выполните:

```bash
cd backend
npm run db:check
```

Скрипт покажет:
- ✅ Статус подключения
- 📊 Список существующих таблиц
- ⚠️ Предупреждения, если таблицы не найдены

## Итоговая структура backend/.env

```env
# ============================================
# ОБЯЗАТЕЛЬНО для backend
# ============================================
DATABASE_URL="postgresql://postgres:пароль@db.xxxxx.supabase.co:5432/postgres?schema=public"

# ============================================
# Настройки приложения
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MYFIN_API_URL=https://api.myfin.by/bank/kursExchange

# ============================================
# Опционально для frontend (если нужно)
# ============================================
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=ваш_ключ
```

## Troubleshooting

### Ошибка: "Can't reach database server"
- Проверьте правильность пароля
- Убедитесь, что проект Supabase активен
- Проверьте Project Reference

### Ошибка: "P1001"
- Попробуйте использовать Connection Pooling (порт 6543)
- Или добавьте `?sslmode=require` в connection string

### Где найти пароль, если забыли?
Settings → Database → Database password → Reset database password
