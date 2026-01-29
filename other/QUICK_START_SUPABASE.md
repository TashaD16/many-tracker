# Быстрый старт с Supabase SDK

## 1. Установка

```bash
cd frontend
npm install @supabase/supabase-js
```

## 2. Настройка .env

Создайте `frontend/.env`:

```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=ваш_публичный_ключ
```

**Где взять ключи:**
1. Откройте Supabase Dashboard
2. Settings → API
3. Скопируйте Project URL и anon public key

## 3. Настройка базы данных

### В Supabase SQL Editor выполните:

```sql
-- Связь User с auth.users
ALTER TABLE "User" 
ADD CONSTRAINT "User_id_fkey" 
FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;
```

### Примените RLS политики:

Скопируйте и выполните содержимое файла `backend/supabase-rls-policies.sql` в Supabase SQL Editor.

## 4. Использование

### Вариант A: Полная замена

В `src/App.js`:

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

### Вариант B: Гибридный (рекомендуется)

Оставьте существующий `AuthProvider`, используйте Supabase SDK для новых функций.

## 5. Пример использования

```jsx
import { useSupabaseAuth } from './context/SupabaseAuthContext';
import { transactionsService } from './services/supabaseService';

function MyComponent() {
  const { user, signIn, signOut } = useSupabaseAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (user) {
      // Загрузить транзакции
      transactionsService.getAll().then(setTransactions);

      // Подписаться на real-time обновления
      const subscription = transactionsService.subscribe((payload) => {
        console.log('Transaction changed:', payload);
        // Обновить список транзакций
      });

      return () => subscription.unsubscribe();
    }
  }, [user]);

  return (
    <div>
      {user ? (
        <button onClick={signOut}>Выйти</button>
      ) : (
        <button onClick={() => signIn('email@example.com', 'password')}>
          Войти
        </button>
      )}
    </div>
  );
}
```

## Готово! ✅

Теперь вы можете использовать Supabase SDK для:
- ✅ Аутентификации
- ✅ Работы с данными
- ✅ Real-time обновлений
- ✅ Безопасности через RLS

Подробнее см. `SUPABASE_MIGRATION_GUIDE.md`
