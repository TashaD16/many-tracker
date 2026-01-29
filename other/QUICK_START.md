# Быстрый старт Money Tracker

## Шаг 1: Установка зависимостей

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Шаг 2: Настройка базы данных

1. Убедитесь, что PostgreSQL запущен
2. Создайте базу данных:
```sql
CREATE DATABASE money_tracker;
```

3. Обновите `DATABASE_URL` в файле `backend/.env`:
```
DATABASE_URL="postgresql://ваш_пользователь:ваш_пароль@localhost:5432/money_tracker?schema=public"
```

## Шаг 3: Инициализация базы данных

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

(Опционально) Заполните тестовыми данными:
```bash
npm run seed
```

## Шаг 4: Запуск приложения

### Терминал 1 - Backend:
```bash
cd backend
npm run dev
```
Backend будет доступен на http://localhost:5000

### Терминал 2 - Frontend:
```bash
cd frontend
npm start
```
Frontend будет доступен на http://localhost:3000

## Проверка работы

1. Откройте браузер: http://localhost:3000
2. Зарегистрируйте нового пользователя или используйте тестовые данные:
   - Email: test@example.com
   - Password: password123 (если запускали seed)

## Возможные проблемы

### Ошибка подключения к базе данных
- Проверьте, что PostgreSQL запущен
- Проверьте правильность DATABASE_URL в .env
- Убедитесь, что база данных создана

### Ошибка "Cannot find module"
- Убедитесь, что выполнили `npm install` в обеих папках
- Проверьте, что все зависимости установлены

### Порт уже занят
- Измените PORT в backend/.env
- Или остановите процесс, использующий порт 5000/3000
