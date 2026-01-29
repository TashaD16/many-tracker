# Полная миграция на Supabase SDK (Вариант A)

## ✅ Что уже сделано

1. ✅ Установлен `@supabase/supabase-js` в package.json
2. ✅ Создан Supabase клиент (`src/lib/supabase.js`)
3. ✅ Создан SupabaseAuthContext (`src/context/SupabaseAuthContext.js`)
4. ✅ Созданы сервисы для работы с данными (`src/services/supabaseService.js`)
5. ✅ Обновлены все страницы для использования Supabase SDK:
   - App.js → SupabaseAuthProvider
   - Login.js → useSupabaseAuth
   - Register.js → useSupabaseAuth
   - Dashboard.js → Supabase сервисы + real-time
   - Transactions.js → Supabase сервисы + real-time
   - Categories.js → Supabase сервисы
   - Accounts.js → Supabase сервисы
   - Budgets.js → Supabase сервисы
   - Transfers.js → Supabase сервисы
   - CurrencyConverter.js → Supabase сервисы
   - Reports.js → Гибридный (Supabase для данных, backend для экспорта)

## Шаг 1: Установка зависимостей

```bash
cd frontend
npm install
```

## Шаг 2: Настройка переменных окружения

Создайте `frontend/.env`:

```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=ваш_публичный_ключ
```

**Где взять:**
- Supabase Dashboard → Settings → API
- Project URL → `REACT_APP_SUPABASE_URL`
- anon public key → `REACT_APP_SUPABASE_ANON_KEY`

## Шаг 3: Настройка базы данных

### 3.1. Обновите схему Prisma для UUID

Схема уже обновлена - `User.id` теперь без `@default(cuid())` для совместимости с Supabase Auth UUID.

### 3.2. Примените миграции

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name supabase_auth_compatibility
```

### 3.3. Связь User с auth.users

В Supabase SQL Editor выполните:

```sql
-- Связь User с auth.users
ALTER TABLE "User" 
ADD CONSTRAINT "User_id_fkey" 
FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;
```

### 3.4. Примените RLS политики

Выполните SQL из файла `backend/supabase-rls-policies.sql` в Supabase SQL Editor.

## Шаг 4: Создание триггера для автоматического создания профиля

В Supabase SQL Editor создайте функцию и триггер:

```sql
-- Функция для создания профиля пользователя
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, password)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '' -- Password handled by Supabase Auth
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Шаг 5: Запуск приложения

```bash
# Frontend
cd frontend
npm start

# Backend (опционально, только для экспорта отчетов и обновления курсов)
cd backend
npm run dev
```

## Что работает через Supabase SDK

✅ **Аутентификация** - полностью через Supabase Auth
✅ **Транзакции** - CRUD через Supabase + real-time
✅ **Категории** - CRUD через Supabase
✅ **Счета** - CRUD через Supabase
✅ **Бюджеты** - CRUD через Supabase
✅ **Переводы** - создание через Supabase
✅ **Дашборд** - данные через Supabase + real-time
✅ **Конвертер валют** - получение курсов через Supabase

## Что осталось через Backend API

⚠️ **Экспорт отчетов** (CSV, PDF) - требует серверной генерации файлов
⚠️ **Обновление курсов валют** - требует cron jobs и внешних API

## Real-time обновления

Supabase автоматически обновляет данные через подписки:

```jsx
// Пример из Dashboard.js
const subscription = supabase
  .channel('dashboard-updates')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'Transaction' },
    () => fetchDashboardData()
  )
  .subscribe();
```

## Проверка работы

1. Запустите frontend: `cd frontend && npm start`
2. Откройте http://localhost:3000
3. Зарегистрируйте нового пользователя
4. Проверьте создание транзакций
5. Проверьте real-time обновления (откройте в двух вкладках)

## Troubleshooting

### Ошибка: "relation does not exist"
- Убедитесь, что миграции Prisma применены
- Проверьте, что таблицы созданы в Supabase

### Ошибка: "new row violates row-level security policy"
- Проверьте, что RLS политики применены
- Убедитесь, что пользователь аутентифицирован
- Проверьте, что `userId` совпадает с `auth.uid()`

### Ошибка: "Invalid API key"
- Проверьте правильность `REACT_APP_SUPABASE_ANON_KEY`
- Убедитесь, что используете anon key, а не service_role key

### Профиль пользователя не создается
- Проверьте, что триггер `on_auth_user_created` создан
- Проверьте логи в Supabase Dashboard → Logs

## Готово! ✅

Теперь приложение полностью использует Supabase SDK для:
- Аутентификации
- Работы с данными
- Real-time обновлений
- Безопасности через RLS

Backend остается только для:
- Экспорта отчетов (CSV, PDF)
- Обновления курсов валют через cron
