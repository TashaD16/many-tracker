# Настройка Supabase SDK

## Установка

### 1. Установите зависимости

```bash
cd frontend
npm install @supabase/supabase-js
```

### 2. Настройте переменные окружения

Создайте или обновите файл `frontend/.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=ваш_публичный_ключ
```

Или для Create React App (если используете):

```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=ваш_публичный_ключ
```

### 3. Получите ключи из Supabase

1. Откройте https://supabase.com
2. Выберите ваш проект
3. Перейдите в **Settings** → **API**
4. Скопируйте:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

## Использование

### Вариант 1: Полная замена на Supabase SDK

Используйте `SupabaseAuthProvider` вместо `AuthProvider`:

```jsx
// src/App.js
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';

function App() {
  return (
    <SupabaseAuthProvider>
      <AppRoutes />
    </SupabaseAuthProvider>
  );
}
```

### Вариант 2: Гибридный подход (рекомендуется)

Используйте Supabase SDK для новых функций, сохраняя существующий backend для сложной логики.

## Структура файлов

- `src/lib/supabase.js` - клиент Supabase
- `src/context/SupabaseAuthContext.js` - контекст аутентификации через Supabase
- `src/services/supabaseService.js` - сервисы для работы с данными

## Миграция с текущего подхода

### Аутентификация

**Было:**
```jsx
const { login, register } = useAuth();
await login(email, password);
```

**Стало:**
```jsx
const { signIn, signUp } = useSupabaseAuth();
await signIn(email, password);
```

### Работа с данными

**Было:**
```jsx
const response = await axios.get('/api/transactions');
```

**Стало:**
```jsx
import { transactionsService } from '../services/supabaseService';
const transactions = await transactionsService.getAll();
```

## Real-time обновления

Supabase предоставляет встроенный real-time через подписки:

```jsx
import { transactionsService } from '../services/supabaseService';

useEffect(() => {
  const subscription = transactionsService.subscribe((payload) => {
    console.log('Transaction changed:', payload);
    // Обновите UI
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Настройка Row Level Security (RLS)

Для безопасности необходимо настроить RLS политики в Supabase:

1. Откройте Supabase Dashboard
2. Перейдите в **Authentication** → **Policies**
3. Создайте политики для каждой таблицы:

### Пример для таблицы Transaction:

```sql
-- Пользователи могут видеть только свои транзакции
CREATE POLICY "Users can view own transactions"
ON Transaction FOR SELECT
USING (auth.uid() = "userId");

-- Пользователи могут создавать только свои транзакции
CREATE POLICY "Users can insert own transactions"
ON Transaction FOR INSERT
WITH CHECK (auth.uid() = "userId");

-- Пользователи могут обновлять только свои транзакции
CREATE POLICY "Users can update own transactions"
ON Transaction FOR UPDATE
USING (auth.uid() = "userId");

-- Пользователи могут удалять только свои транзакции
CREATE POLICY "Users can delete own transactions"
ON Transaction FOR DELETE
USING (auth.uid() = "userId");
```

Аналогичные политики нужно создать для:
- Account
- Category
- Budget
- Transfer

## Миграция схемы базы данных

Текущая схема Prisma должна быть адаптирована:

1. Таблица `User` должна использовать `uuid` вместо `cuid()` для совместимости с Supabase Auth
2. Добавьте связь между `auth.users` и вашей таблицей `User`:

```sql
-- В Supabase SQL Editor
ALTER TABLE "User" 
ADD CONSTRAINT "User_id_fkey" 
FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;
```

## Преимущества Supabase SDK

1. ✅ Встроенная аутентификация
2. ✅ Real-time обновления без WebSocket
3. ✅ Автоматическая синхронизация
4. ✅ Row Level Security
5. ✅ Storage для файлов
6. ✅ Edge Functions для серверной логики

## Следующие шаги

1. Установите зависимости: `npm install @supabase/supabase-js`
2. Настройте переменные окружения
3. Выберите подход (полная замена или гибридный)
4. Настройте RLS политики
5. Мигрируйте компоненты постепенно
