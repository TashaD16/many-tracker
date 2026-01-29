# Настройка shadcn/ui

## Установка зависимостей

```bash
cd frontend
npm install
```

Это установит:
- Tailwind CSS и PostCSS
- Radix UI компоненты
- Lucide React иконки
- Утилиты (clsx, tailwind-merge, class-variance-authority)

## Структура компонентов

Все компоненты shadcn/ui находятся в `src/components/ui/`:
- `button.jsx` - кнопки
- `card.jsx` - карточки
- `input.jsx` - поля ввода
- `label.jsx` - метки
- `dialog.jsx` - модальные окна
- `select.jsx` - выпадающие списки
- `table.jsx` - таблицы
- `alert.jsx` - уведомления

## Использование

### Пример кнопки:
```jsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="default">Click me</Button>
```

### Пример карточки:
```jsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

## Стили

Все стили определены в `src/index.css` с использованием CSS переменных для темной/светлой темы.

## Дополнительные компоненты

Для добавления новых компонентов shadcn/ui используйте:
```bash
npx shadcn-ui@latest add [component-name]
```

Или создавайте вручную по образцу существующих компонентов.
