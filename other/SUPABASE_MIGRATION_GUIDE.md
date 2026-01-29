# Руководство по миграции на Supabase SDK

## Шаг 1: Установка зависимостей

```bash
cd frontend
npm install @supabase/supabase-js
```

## Шаг 2: Настройка переменных окружения

Создайте `frontend/.env`:

```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=ваш_публичный_ключ
```

Получите ключи из Supabase Dashboard → Settings → API

## Шаг 3: Настройка базы данных

### 3.1. Обновите схему для совместимости с Supabase Auth

В Supabase SQL Editor выполните:

```sql
-- Измените тип ID на UUID для совместимости с auth.users
-- Это нужно сделать перед применением миграций Prisma

-- Связь User с auth.users
ALTER TABLE "User" 
ADD CONSTRAINT "User_id_fkey" 
FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;
```

### 3.2. Примените миграции Prisma

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 3.3. Настройте Row Level Security

Выполните SQL скрипт `backend/supabase-rls-policies.sql` в Supabase SQL Editor.

## Шаг 4: Выберите подход миграции

### Вариант A: Полная замена (рекомендуется для новых проектов)

Замените `AuthProvider` на `SupabaseAuthProvider` в `App.js`:

```jsx
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';

function App() {
  return (
    <SupabaseAuthProvider>
      <AppRoutes />
    </SupabaseAuthProvider>
  );
}
```

### Вариант B: Гибридный подход (рекомендуется для существующих проектов)

Используйте Supabase SDK для новых функций, сохраняя существующий backend для:
- Сложной бизнес-логики
- Экспорта отчетов (CSV, PDF)
- Обновления курсов валют
- WebSocket для real-time

## Шаг 5: Миграция компонентов

### Аутентификация

**Было:**
```jsx
import { useAuth } from './context/AuthContext';
const { login, register } = useAuth();
```

**Стало:**
```jsx
import { useSupabaseAuth } from './context/SupabaseAuthContext';
const { signIn, signUp } = useSupabaseAuth();
```

### Работа с данными

**Было:**
```jsx
const response = await axios.get('/api/transactions');
const transactions = response.data.transactions;
```

**Стало:**
```jsx
import { transactionsService } from '../services/supabaseService';
const transactions = await transactionsService.getAll({ type: 'expense' });
```

## Шаг 6: Real-time обновления

Supabase предоставляет встроенный real-time:

```jsx
import { supabase } from '../lib/supabase';

useEffect(() => {
  const subscription = supabase
    .channel('transactions')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'Transaction' },
      (payload) => {
        console.log('Change received!', payload);
        // Обновите состояние
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Преимущества миграции

1. ✅ **Встроенная аутентификация** - не нужно управлять JWT вручную
2. ✅ **Real-time из коробки** - без WebSocket сервера
3. ✅ **Row Level Security** - безопасность на уровне базы данных
4. ✅ **Автоматическая синхронизация** - Supabase управляет сессиями
5. ✅ **Storage** - для файлов и изображений
6. ✅ **Edge Functions** - для серверной логики

## Что сохранить из текущего подхода

- Backend для сложной бизнес-логики (переводы с конвертацией валют)
- Экспорт отчетов (CSV, PDF)
- Обновление курсов валют через cron
- Валидация данных на сервере

## Проверка работы

1. Установите зависимости: `npm install`
2. Настройте `.env` с Supabase ключами
3. Примените RLS политики
4. Запустите приложение: `npm start`
5. Зарегистрируйте нового пользователя
6. Проверьте создание транзакций

## Troubleshooting

### Ошибка: "relation does not exist"
- Убедитесь, что миграции Prisma применены
- Проверьте, что таблицы созданы в Supabase

### Ошибка: "new row violates row-level security policy"
- Проверьте, что RLS политики применены
- Убедитесь, что пользователь аутентифицирован

### Ошибка: "Invalid API key"
- Проверьте правильность `REACT_APP_SUPABASE_ANON_KEY`
- Убедитесь, что используете anon key, а не service_role key

## Дополнительные ресурсы

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
