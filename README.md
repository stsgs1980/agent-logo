# LOGO — NEURO Brand Identity Agent

{{LOGO}}

Автоматическая система выбора логотипа NEURO по описанию проекта.
Определяет тему (light / dark / mono / outline / inverted) и подставляет нужный SVG.

---

## Быстрый старт — встроить в новый проект

### Способ 1. Копировать файлы вручную

```bash
# 1. Скопировать ядро и логотипы в корень вашего проекта
cp -r scripts/  /путь/к/вашему/проекту/scripts/
cp -r logos/    /путь/к/вашему/проекту/logos/

# 2. Добавить description в package.json
cd /путь/к/вашему/проекту
jq '. + {description: "Описание вашего проекта"}' package.json > tmp.json && mv tmp.json package.json

# 3. Поставить {{LOGO}} в README.md где нужен логотип

# 4. Проверить
node scripts/logo-agent.js "Описание вашего проекта" auto
```

### Способ 2. Подключить как npm-зависимость (рекомендуется)

В `package.json` вашего проекта:

```json
{
  "dependencies": {
    "logo-agent": "github:Sts8987/LOGO"
  }
}
```

```bash
npm install
```

После этого модуль доступен:

```js
var logo = require('logo-agent/scripts/logo-agent');
var theme = logo.resolve(
  logo.detectContent('Тёмная AI-платформа'),
  logo.detectDarkUI('Тёмная AI-платформа'),
  'auto'
);
// theme === 'dark'
```

---

## Что куда встраивать

| Компонент | Файл | Куда | Когда |
|---|---|---|---|
| Ядро детекции | `scripts/logo-agent.js` | `scripts/` проекта | Всегда — основа |
| SVG логотипы | `logos/*.svg` (7 штук) | `logos/` проекта | Всегда — подстановка |
| CI воркфлоу | `.github/workflows/logo.yml` | `.github/workflows/` | Если есть GitHub Actions |
| Git-хук | `.git/hooks/prepare-commit-msg` | `.git/hooks/` | Если хотите лого в коммитах |
| Сервер подписи | Код из `server.js` | В ваш Express-роутер | Если нужна email-подпись |

---

## CLI

```bash
node scripts/logo-agent.js "описание проекта" [режим]
```

**Режимы:** `auto` (по умолчанию) | `dark` | `light`

```bash
node scripts/logo-agent.js "Тёмная AI-платформа" auto
# → dark

node scripts/logo-agent.js "Образовательная платформа" auto
# → light

node scripts/logo-agent.js "Образовательная платформа" dark
# → dark  (принудительно)
```

### Как работает детекция

1. Текст описания проверяется по 5 наборам ключевых слов (`contentRules`)
2. Набор с максимальным числом совпадений определяет тему: `light` / `dark` / `mono` / `outline` / `inverted`
3. Если в описании есть триггеры тёмного UI (`darkUIKeys` — 14 ключей) — тема адаптируется через `darkAdapt`
4. Ручной режим (`dark` / `light`) перекрывает авто-детекцию

### Карта адаптации

```
Светлый UI:                     Тёмный UI:
  light     → light               light     → dark
  mono      → mono                mono      → mono-dark
  outline   → outline             outline   → outline-dark
  inverted  → inverted            inverted  → inverted
  dark      → light (обратно)     dark      → dark
```

---

## HTTP API — Email-подпись

Встроить в ваш Express-сервер:

```js
var logoAgent = require('./scripts/logo-agent');
var detectContent = logoAgent.detectContent;
var detectDarkUI  = logoAgent.detectDarkUI;
var resolve       = logoAgent.resolve;

var fs   = require('fs');
var path = require('path');

function readLogoSvg(theme) {
    var safe = theme.replace(/[^a-z0-9\-]/gi, '');
    try { return fs.readFileSync(path.join(__dirname, 'logos', safe + '.svg'), 'utf8'); }
    catch (e) { return fs.readFileSync(path.join(__dirname, 'logos', 'light.svg'), 'utf8'); }
}

function sigHTML(logoSvg, q) {
    return '<table cellpadding="0" cellspacing="0"'
      + ' style="border-top:2px solid #FA3913;padding-top:10px;font-family:Arial,sans-serif">'
      + '<tr><td style="padding-right:14px;vertical-align:middle">'
      + logoSvg + '</td>'
      + '<td style="vertical-align:middle">'
      + '<div style="font-size:15px;font-weight:bold;color:#343439">' + (q.name||'') + '</div>'
      + '<div style="font-size:12px;color:#999;margin-top:2px">' + (q.role||'') + '</div>'
      + '<div style="font-size:11px;color:#bbb;margin-top:4px">'
      + (q.email||'') + ' | ' + (q.phone||'') + '</div>'
      + '</td></tr></table>';
}

app.get('/api/signature', function(req, res) {
    var content = detectContent(req.query.project || '');
    var dark    = detectDarkUI(req.query.project || '');
    var theme   = resolve(content, dark, req.query.mode || 'auto');
    res.type('html').send(sigHTML(readLogoSvg(theme), req.query));
});
```

Результат — HTML-таблица, которую копируете в настройки подписи Gmail / Outlook / Apple Mail.

---

## CI — GitHub Actions

Файл `.github/workflows/logo.yml` автоматически:

1. Читает `description` из `package.json`
2. Вызывает `logo-agent.js` для определения темы
3. Подставляет SVG вместо `{{LOGO}}` в README.md
4. Коммитит обновлённый README

**Принудительный режим:**
```bash
DARK_MODE=dark npm run build   # всегда тёмная тема
DARK_MODE=light npm run build  # всегда светлая тема
```

---

## Git Hook — логотип в коммитах

```bash
# Установка (один раз в каждом клоне репозитория)
cp scripts/prepare-commit-msg .git/hooks/
chmod +x .git/hooks/prepare-commit-msg
```

При каждом `git commit` в тело коммита добавляется SVG-логотип.
Видно в `git log --format=full`.

Ручной override: создать файл `.logo-mode` в корне:
```bash
echo "dark" > .logo-mode
```

---

## Добавить новую тему

1. В `scripts/logo-agent.js` — добавить ключевые слова в `contentRules`
2. Добавить вариант в `darkAdapt` / `lightAdapt`
3. Создать `logos/<theme>.svg`
4. Остальные файлы не трогать — они всё подхватят

---

## Структура репозитория

```
LOGO/
├── scripts/
│   └── logo-agent.js          ← Ядро: 5 тем, 14 триггеров, resolve()
├── logos/
│   ├── light.svg              ← Белый фон, графитовый текст
│   ├── dark.svg               ← Тёмный фон, белый текст
│   ├── mono.svg               ← Монохром, белый фон
│   ├── mono-dark.svg          ← Монохром, тёмный фон
│   ├── outline.svg            ← Контур, белый фон
│   ├── outline-dark.svg       ← Контур, тёмный фон
│   └── inverted.svg           ← Коралловый фон, инвертированные цвета
├── server.js                  ← Express: /api/signature + /api/logo-theme
├── .github/workflows/
│   └── logo.yml               ← CI: SVG в README по description
├── package.json
└── README.md
```
