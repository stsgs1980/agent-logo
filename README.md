# Logo Agent Project

{{LOGO}}

## Описание

Автоматическая система выбора логотипа по текстовому описанию проекта.

## Использование

### CLI

```bash
node scripts/logo-agent.js "Тёмная AI-платформа" auto
# → dark

node scripts/logo-agent.js "Образовательная платформа" auto
# → light

node scripts/logo-agent.js "Образовательная платформа" dark
# → dark  (ручной override)
```

### Сервер подписей

```bash
npm start
curl "http://localhost:3000/api/signature?project=Тёмная+AI-платформа&name=Иван&role=CTO&email=ivan@neuro.ai&phone=+7999"
```

### CI (GitHub Actions)

При каждом пуше в `main` — логотип в README обновляется автоматически на основе `description` из `package.json`.

### Git Hook

При каждом коммите — логотип добавляется в тело коммита (видно в `git log --format=full`).

## Структура

```
├── scripts/
│   └── logo-agent.js        ← Ядро: определение темы логотипа
├── logos/
│   ├── light.svg
│   ├── dark.svg
│   ├── mono.svg
│   ├── mono-dark.svg
│   ├── outline.svg
│   ├── outline-dark.svg
│   └── inverted.svg
├── server.js                 ← HTTP-эндпоинт для email-подписи
├── .github/workflows/
│   └── logo.yml              ← CI: подстановка SVG в README
├── .git/hooks/
│   └── prepare-commit-msg    ← Git-хук: логотип в коммите
└── package.json
```
