# Настройка подключения к Supabase

## Шаг 1: Создание проекта в Supabase

1. Перейдите на https://supabase.com
2. Войдите или зарегистрируйтесь
3. Создайте новый проект:
   - Выберите организацию
   - Введите название проекта (например, `money-tracker`)
   - Введите пароль для базы данных (сохраните его!)
   - Выберите регион
   - Нажмите "Create new project"

## Шаг 2: Получение connection string

1. В панели Supabase перейдите в **Settings** → **Database**
2. Найдите секцию **Connection string**
3. Выберите **URI** или **Connection pooling**
4. Скопируйте connection string (он будет выглядеть так):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Замените `[YOUR-PASSWORD]` на пароль, который вы установили при создании проекта

## Шаг 3: Настройка backend/.env

Обновите файл `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:ваш_пароль@db.xxxxx.supabase.co:5432/postgres?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MYFIN_API_URL=https://api.myfin.by/bank/kursExchange
```

**Важно:** 
- Замените `ваш_пароль` на пароль от базы данных Supabase
- Замените `xxxxx` на ваш Project Reference из Supabase
- Если используете Connection Pooling, добавьте `?pgbouncer=true` в конец URL

## Шаг 4: Настройка Prisma для Supabase

Prisma уже настроен для работы с PostgreSQL, поэтому дополнительная настройка не требуется.

## Шаг 5: Применение миграций

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

Или если база уже существует и вы хотите только применить миграции:
```bash
npx prisma migrate deploy
```

## Шаг 6: (Опционально) Заполнение тестовыми данными

```bash
npm run seed
```

## Использование Supabase Studio

Supabase предоставляет встроенный SQL Editor и Table Editor:

1. В панели Supabase перейдите в **Table Editor** для просмотра данных
2. Используйте **SQL Editor** для выполнения запросов
3. Используйте **Database** → **Tables** для управления схемой

## Connection Pooling (рекомендуется для продакшена)

Для лучшей производительности используйте Connection Pooling:

1. В Supabase перейдите в **Settings** → **Database**
2. Найдите **Connection pooling**
3. Используйте connection string с портом 6543:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
   ```

## Безопасность

⚠️ **Важно:**
- Никогда не коммитьте файл `.env` в Git
- Используйте разные пароли для development и production
- Регулярно обновляйте пароли базы данных
- Используйте Row Level Security (RLS) в Supabase для дополнительной защиты

## Troubleshooting

### Ошибка подключения
- Проверьте правильность connection string
- Убедитесь, что пароль указан правильно
- Проверьте, что проект Supabase активен (не приостановлен)

### Ошибка миграций
- Убедитесь, что используете правильный connection string
- Проверьте права доступа к базе данных
- Попробуйте выполнить `npx prisma migrate reset` (осторожно: удалит все данные)

### Проблемы с SSL
Если возникают проблемы с SSL, добавьте в connection string:
```
?sslmode=require
```
