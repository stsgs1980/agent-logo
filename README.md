# LOGO — NEURO Brand Identity Agent

{{LOGO}}

Автоматическая система выбора логотипа NEURO по описанию проекта.
Определяет тему (light / dark / mono / outline / inverted) и подставляет нужный SVG.

---

## Быстрый старт — встроить в проект

### В существующий проект

Например, если ваш проект лежит в `~/projects/my-app`:

```bash
git clone https://github.com/Sts8987/LOGO.git /tmp/LOGO
cd ~/projects/my-app
cp -r /tmp/LOGO/scripts/ /tmp/LOGO/logos/ .
bash scripts/setup.sh
```

### В новый проект

```bash
mkdir my-new-project && cd my-new-project
git init
npm init -y
# Встроить логотип:
git clone https://github.com/Sts8987/LOGO.git /tmp/LOGO
cp -r /tmp/LOGO/scripts/ /tmp/LOGO/logos/ .
bash scripts/setup.sh
```

`setup.sh` автоматически:
- проверит зависимости (node, jq)
- установит git-хук `prepare-commit-msg`
- проверит `description` в `package.json`
- определит тему логотипа для вашего проекта

### В песочнице Z.ai

Если проект создаётся в [Z.ai](https://chat.z.ai/), рабочий каталог проекта находится по пути `/home/z/my-project/download/`. Попросите агента встроить логотип — он выполнит команды:

```bash
# Клонировать LOGO-репозиторий во временную папку
git clone https://github.com/Sts8987/LOGO.git /tmp/LOGO

# Скопировать ядро и логотипы в проект
cp -r /tmp/LOGO/scripts/ /home/z/my-project/download/<имя-проекта>/scripts/
cp -r /tmp/LOGO/logos/   /home/z/my-project/download/<имя-проекта>/logos/

# Перейти в проект и запустить установку
cd /home/z/my-project/download/<имя-проекта>
bash scripts/setup.sh
```

Или одной командой:

```bash
git clone https://github.com/Sts8987/LOGO.git /tmp/LOGO && \
cp -r /tmp/LOGO/scripts/ /tmp/LOGO/logos/ /home/z/my-project/download/<имя-проекта>/ && \
cd /home/z/my-project/download/<имя-проекта> && bash scripts/setup.sh
```

**Что происходит дальше:**
- CI-воркфлоу (`.github/workflows/logo.yml`) при push в GitHub автоматически определит тему по `description` из `package.json` и вставит SVG вместо `{{LOGO}}` в README.md
- Git-хук добавит логотип в тело каждого коммита
- Сервер подписи (`server.js`) доступен по HTTP внутри песочницы

**Пример в чате Z.ai:**
> «Создай проект и встрои логотип NEURO»

Агент сам клонирует LOGO-репозиторий, скопирует файлы и запустит `setup.sh`.

### Использование как npm-модуль

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
| Установка | `scripts/setup.sh` | `scripts/` проекта | Всегда — автоматическая настройка |
| SVG логотипы | `logos/*.svg` (7 штук) | `logos/` проекта | Всегда — подстановка |
| CI воркфлоу | `.github/workflows/logo.yml` | `.github/workflows/` | Если есть GitHub Actions |
| Git-хук | `scripts/prepare-commit-msg` | `.git/hooks/` | Если хотите лого в коммитах |
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
│   ├── logo-agent.js          ← Ядро: 5 тем, 14 триггеров, resolve()
│   ├── setup.sh               ← Автоматическая установка в проект
│   └── prepare-commit-msg     ← Git-хук: логотип в теле коммита
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
