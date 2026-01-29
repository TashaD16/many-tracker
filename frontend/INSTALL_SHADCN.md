# Установка shadcn/ui

## Шаг 1: Установите зависимости

```bash
cd frontend
npm install
```

Это установит все необходимые пакеты:
- Tailwind CSS и PostCSS
- Radix UI компоненты
- Lucide React иконки
- Утилиты (clsx, tailwind-merge, class-variance-authority)

## Шаг 2: Проверьте конфигурацию

Убедитесь, что созданы файлы:
- ✅ `tailwind.config.js` - конфигурация Tailwind
- ✅ `postcss.config.js` - конфигурация PostCSS
- ✅ `src/index.css` - стили с CSS переменными
- ✅ `src/lib/utils.js` - утилита `cn()` для классов

## Шаг 3: Компоненты уже созданы

Все базовые компоненты shadcn/ui находятся в `src/components/ui/`:
- ✅ `button.jsx`
- ✅ `card.jsx`
- ✅ `input.jsx`
- ✅ `label.jsx`
- ✅ `dialog.jsx`
- ✅ `select.jsx`
- ✅ `table.jsx`
- ✅ `alert.jsx`

## Шаг 4: Запустите приложение

```bash
npm start
```

## Что уже заменено

✅ **App.js** - использует Tailwind классы вместо MUI Container
✅ **Navbar** - полностью переписан на shadcn/ui с Lucide иконками
✅ **Login** - использует Card, Input, Button, Label, Alert
✅ **Register** - использует Card, Input, Button, Label, Alert

## Что нужно заменить

⚠️ Остальные страницы еще используют MUI:
- Dashboard
- Transactions
- Categories
- Accounts
- Transfers
- Budgets
- CurrencyConverter
- Reports

## Добавление новых компонентов

Если нужны дополнительные компоненты shadcn/ui, создавайте их вручную по образцу существующих или используйте документацию: https://ui.shadcn.com

## Troubleshooting

### Ошибка: "Cannot find module 'tailwindcss'"
```bash
npm install -D tailwindcss postcss autoprefixer
```

### Стили не применяются
- Убедитесь, что `src/index.css` импортирован в `src/index.js`
- Проверьте, что Tailwind директивы есть в начале `index.css`

### Иконки не отображаются
- Убедитесь, что `lucide-react` установлен
- Проверьте импорты иконок
