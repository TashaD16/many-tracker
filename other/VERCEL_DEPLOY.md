# Деплой на Vercel

## Вариант 1: Только Frontend (Рекомендуется)

Так как мы используем Supabase SDK, большая часть логики на клиенте. Backend нужен только для экспорта отчетов и обновления курсов валют.

### Шаг 1: Подготовка

1. Убедитесь, что проект готов к деплою:
```bash
cd frontend
npm run build
```

2. Проверьте, что все зависимости установлены:
```bash
npm install
```

### Шаг 2: Деплой через Vercel CLI

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Войдите в Vercel:
```bash
vercel login
```

3. Перейдите в папку frontend:
```bash
cd frontend
```

4. Задеплойте проект:
```bash
vercel
```

5. Для production деплоя:
```bash
vercel --prod
```

### Шаг 3: Настройка переменных окружения

В Vercel Dashboard → Settings → Environment Variables добавьте:

```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=ваш_публичный_ключ
```

### Шаг 4: Деплой через GitHub (Рекомендуется)

1. Закоммитьте изменения:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

2. Импортируйте проект в Vercel:
   - Откройте https://vercel.com
   - Нажмите "Add New Project"
   - Выберите ваш репозиторий
   - Настройте:
     - **Framework Preset**: Create React App
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`
     - **Install Command**: `npm install`

3. Добавьте Environment Variables (см. Шаг 3)

4. Нажмите "Deploy"

## Вариант 2: Frontend + Backend API Routes

Если нужно задеплоить backend на Vercel как Serverless Functions:

### Структура проекта

```
.
├── frontend/
│   └── ...
├── api/
│   ├── reports/
│   │   └── [format].js
│   ├── currencies/
│   │   └── rates/
│   │       └── update.js
│   └── ...
└── vercel.json
```

### Создание API Routes

Создайте `api/reports/[format].js`:
```javascript
export default async function handler(req, res) {
  // Логика экспорта отчетов
}
```

### Конфигурация vercel.json

```json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

## Вариант 3: Гибридный подход (Рекомендуется для production)

- **Frontend**: Vercel
- **Backend API**: Railway, Render или другой сервис
- **Database**: Supabase

### Настройка

1. Задеплойте frontend на Vercel (см. Вариант 1)

2. Задеплойте backend на Railway/Render:
   - Следуйте инструкциям в `DEPLOY.md`
   - Получите URL backend API

3. Обновите переменные окружения в Vercel:
```
REACT_APP_API_URL=https://your-backend.railway.app
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=ваш_ключ
```

## Настройка домена

1. В Vercel Dashboard → Settings → Domains
2. Добавьте ваш домен
3. Следуйте инструкциям для настройки DNS

## Continuous Deployment

После подключения GitHub, каждый push в main ветку автоматически деплоится.

## Environment Variables

### Production
```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=ваш_публичный_ключ
```

### Preview (опционально)
Можно использовать тестовые ключи Supabase для preview окружений.

## Troubleshooting

### Ошибка: "Build failed"
- Проверьте, что все зависимости в `package.json`
- Убедитесь, что `npm run build` работает локально
- Проверьте логи в Vercel Dashboard

### Ошибка: "Module not found"
- Убедитесь, что все импорты правильные
- Проверьте, что пути к файлам корректны

### Стили не применяются
- Убедитесь, что `index.css` импортирован в `index.js`
- Проверьте, что Tailwind правильно настроен

### Supabase не работает
- Проверьте переменные окружения в Vercel
- Убедитесь, что используете правильные ключи (anon key, не service_role)

## Оптимизация

### 1. Уменьшение размера бандла
- Используйте динамические импорты для больших библиотек
- Проверьте bundle size в Vercel Analytics

### 2. Кэширование
Vercel автоматически кэширует статические файлы.

### 3. CDN
Vercel использует глобальный CDN для быстрой загрузки.

## Мониторинг

Vercel предоставляет:
- Analytics
- Speed Insights
- Logs
- Real-time monitoring

## Готово! ✅

После деплоя ваш сайт будет доступен по адресу:
`https://your-project.vercel.app`
