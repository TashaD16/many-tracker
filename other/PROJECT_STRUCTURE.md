# Структура проекта Money Tracker

## Общая структура

```
money-tracker/
├── backend/              # Backend API (Node.js + Express)
│   ├── __tests__/       # Тесты
│   ├── middleware/      # Middleware (auth, validation)
│   ├── prisma/          # Prisma схемы и миграции
│   ├── routes/          # API маршруты
│   ├── utils/           # Утилиты (currency updater)
│   ├── server.js        # Точка входа сервера
│   ├── package.json     # Зависимости backend
│   └── jest.config.js   # Конфигурация Jest
│
├── frontend/            # Frontend (React)
│   ├── public/          # Статические файлы
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── context/     # React Context (Auth)
│   │   ├── pages/       # Страницы приложения
│   │   ├── utils/       # Утилиты (WebSocket)
│   │   ├── App.js       # Главный компонент
│   │   └── index.js     # Точка входа
│   └── package.json     # Зависимости frontend
│
├── README.MD            # Основная документация
├── DEPLOY.md            # Инструкции по деплою
└── PROJECT_STRUCTURE.md # Этот файл
```

## Backend структура

### Routes (API endpoints)

- `auth.js` - Аутентификация (регистрация, вход, получение текущего пользователя)
- `accounts.js` - Управление счетами (CRUD)
- `categories.js` - Управление категориями (CRUD)
- `transactions.js` - Управление транзакциями (CRUD, фильтрация)
- `transfers.js` - Переводы между счетами
- `budgets.js` - Управление бюджетами
- `currencies.js` - Курсы валют и конвертация
- `dashboard.js` - Данные для дашборда
- `reports.js` - Экспорт отчетов (CSV, PDF)

### Middleware

- `auth.js` - JWT аутентификация middleware

### Utils

- `currencyUpdater.js` - Обновление курсов валют из API myfin.by

### Prisma

- `schema.prisma` - Схема базы данных
- `seed.js` - Заполнение тестовыми данными

## Frontend структура

### Pages

- `Login.js` - Страница входа
- `Register.js` - Страница регистрации
- `Dashboard.js` - Главная страница с обзором
- `Transactions.js` - Управление транзакциями
- `Categories.js` - Управление категориями
- `Accounts.js` - Управление счетами
- `Transfers.js` - Переводы между счетами
- `Budgets.js` - Управление бюджетами
- `CurrencyConverter.js` - Конвертер валют
- `Reports.js` - Экспорт отчетов

### Components

- `Navbar.js` - Навигационная панель

### Context

- `AuthContext.js` - Контекст аутентификации с WebSocket поддержкой

### Utils

- `websocket.js` - WebSocket клиент для real-time обновлений

## База данных (Prisma Schema)

### Модели

1. **User** - Пользователи
2. **Account** - Счета пользователей
3. **Category** - Категории доходов/расходов
4. **Transaction** - Транзакции (доходы/расходы)
5. **Transfer** - Переводы между счетами
6. **Budget** - Бюджеты по категориям
7. **CurrencyRate** - Курсы валют

## API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Получить текущего пользователя

### Transactions
- `GET /api/transactions` - Получить транзакции (с фильтрами)
- `POST /api/transactions` - Создать транзакцию
- `GET /api/transactions/:id` - Получить транзакцию
- `PUT /api/transactions/:id` - Обновить транзакцию
- `DELETE /api/transactions/:id` - Удалить транзакцию

### Categories
- `GET /api/categories` - Получить категории
- `POST /api/categories` - Создать категорию
- `GET /api/categories/:id` - Получить категорию
- `PUT /api/categories/:id` - Обновить категорию
- `DELETE /api/categories/:id` - Удалить категорию

### Accounts
- `GET /api/accounts` - Получить счета
- `POST /api/accounts` - Создать счет
- `GET /api/accounts/:id` - Получить счет
- `PUT /api/accounts/:id` - Обновить счет
- `DELETE /api/accounts/:id` - Удалить счет

### Transfers
- `GET /api/transfers` - Получить переводы
- `POST /api/transfers` - Создать перевод
- `GET /api/transfers/:id` - Получить перевод

### Budgets
- `GET /api/budgets` - Получить бюджеты
- `POST /api/budgets` - Создать бюджет
- `GET /api/budgets/:id` - Получить бюджет
- `PUT /api/budgets/:id` - Обновить бюджет
- `DELETE /api/budgets/:id` - Удалить бюджет

### Currencies
- `GET /api/currencies/rates` - Получить курсы валют
- `GET /api/currencies/rates/:from/:to` - Получить курс для пары валют
- `POST /api/currencies/rates/update` - Обновить курсы
- `POST /api/currencies/convert` - Конвертировать валюту

### Dashboard
- `GET /api/dashboard` - Получить данные дашборда

### Reports
- `GET /api/reports/export/csv` - Экспорт в CSV
- `GET /api/reports/export/pdf` - Экспорт в PDF

## Безопасность

- ✅ Пароли хешируются с помощью bcryptjs
- ✅ JWT токены для аутентификации
- ✅ Helmet для защиты от XSS и других атак
- ✅ Rate limiting для API endpoints
- ✅ Валидация данных на сервере
- ✅ SQL инъекции защищены через Prisma ORM
- ✅ CORS настроен для работы с frontend

## Тестирование

### Backend тесты
- `__tests__/auth.test.js` - Тесты аутентификации
- `__tests__/transactions.test.js` - Тесты транзакций
- `__tests__/accounts.test.js` - Тесты счетов

Запуск тестов:
```bash
cd backend
npm test
```

## Real-time обновления

Приложение использует WebSocket для real-time обновлений:
- Обновления транзакций
- Обновления переводов
- Обновления балансов счетов

WebSocket подключение устанавливается автоматически при входе пользователя.
