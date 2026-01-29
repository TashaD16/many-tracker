# Настройка Vercel для Money Tracker

## Важно: Настройки проекта в Vercel Dashboard

При импорте проекта в Vercel необходимо указать:

### Root Directory
**`frontend`** - это критически важно!

### Build Settings
- **Framework Preset**: `Create React App`
- **Build Command**: `npm run build` (автоматически)
- **Output Directory**: `build` (автоматически)
- **Install Command**: `npm install` (автоматически)

### Environment Variables
Добавьте в Vercel Dashboard → Settings → Environment Variables:

```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=ваш_публичный_ключ
```

## Почему возникает ошибка 404?

Ошибка `NOT_FOUND` возникает, если:
1. ❌ Root Directory не указан или указан неправильно
2. ❌ Vercel пытается собрать проект из корня вместо `frontend/`
3. ❌ Файл `package.json` не найден в указанной директории

## Решение

1. Откройте Vercel Dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **General**
4. Найдите **Root Directory**
5. Установите: **`frontend`**
6. Сохраните изменения
7. Перезапустите деплой

## Альтернатива: Использование vercel.json в корне

Если хотите использовать корневой `vercel.json`, убедитесь что:
- Указан правильный путь к `package.json`
- Указан правильный `outputDirectory`

Но **рекомендуется** использовать настройки в Dashboard с Root Directory = `frontend`.
