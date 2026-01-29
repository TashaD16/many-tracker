# Инструкции по деплою Money Tracker

## Деплой на Heroku

### Backend

1. Установите Heroku CLI и войдите:
```bash
heroku login
```

2. Создайте приложение:
```bash
cd backend
heroku create money-tracker-api
```

3. Добавьте PostgreSQL addon:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

4. Установите переменные окружения:
```bash
heroku config:set JWT_SECRET=your-production-secret-key-change-this
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://your-frontend-url.vercel.app
heroku config:set MYFIN_API_URL=https://api.myfin.by/bank/kursExchange
```

5. Запустите миграции Prisma:
```bash
heroku run npx prisma migrate deploy
```

6. (Опционально) Заполните базу тестовыми данными:
```bash
heroku run npm run seed
```

7. Задеплойте:
```bash
git push heroku main
```

### Frontend на Vercel

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Перейдите в папку frontend:
```bash
cd frontend
```

3. Создайте файл `.env.production`:
```
REACT_APP_API_URL=https://money-tracker-api.herokuapp.com
REACT_APP_WS_URL=wss://money-tracker-api.herokuapp.com
```

4. Задеплойте:
```bash
vercel --prod
```

Или используйте веб-интерфейс Vercel:
- Подключите GitHub репозиторий
- Укажите корневую папку: `frontend`
- Добавьте переменные окружения:
  - `REACT_APP_API_URL` = ваш backend URL
  - `REACT_APP_WS_URL` = ваш WebSocket URL (wss:// для HTTPS)

## Деплой на Railway

### Backend

1. Установите Railway CLI:
```bash
npm i -g @railway/cli
railway login
```

2. Инициализируйте проект:
```bash
cd backend
railway init
```

3. Добавьте PostgreSQL:
```bash
railway add postgresql
```

4. Установите переменные окружения в Railway dashboard или через CLI:
```bash
railway variables set JWT_SECRET=your-secret
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://your-frontend-url
```

5. Запустите миграции:
```bash
railway run npx prisma migrate deploy
```

6. Задеплойте:
```bash
railway up
```

## Деплой на Render

### Backend

1. Создайте новый Web Service на Render
2. Подключите GitHub репозиторий
3. Настройки:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
4. Добавьте PostgreSQL database
5. Установите переменные окружения:
   - `DATABASE_URL` (автоматически из PostgreSQL)
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `FRONTEND_URL`
   - `MYFIN_API_URL`

### Frontend

1. Создайте новый Static Site на Render
2. Подключите GitHub репозиторий
3. Настройки:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Добавьте переменные окружения:
   - `REACT_APP_API_URL`
   - `REACT_APP_WS_URL`

## Проверка после деплоя

1. Проверьте health endpoint:
```bash
curl https://your-backend-url.herokuapp.com/health
```

2. Проверьте подключение к базе данных:
```bash
heroku run npx prisma studio
```

3. Проверьте логи:
```bash
heroku logs --tail
```

## Обновление приложения

После изменений в коде:

1. Backend:
```bash
cd backend
git push heroku main
heroku run npx prisma migrate deploy  # если были изменения в схеме
```

2. Frontend:
```bash
cd frontend
vercel --prod
```

## Troubleshooting

### Проблемы с базой данных

Если миграции не применяются:
```bash
heroku run npx prisma migrate reset  # ОСТОРОЖНО: удалит все данные
heroku run npx prisma migrate deploy
```

### Проблемы с WebSocket

Убедитесь, что:
- WebSocket URL использует правильный протокол (wss:// для HTTPS)
- CORS настроен правильно
- WebSocket сервер запущен на том же домене или настроен proxy

### Проблемы с переменными окружения

Проверьте все переменные:
```bash
heroku config
```

Убедитесь, что в frontend `.env.production` указаны правильные URL.
