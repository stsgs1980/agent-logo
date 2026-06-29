# NEURO Brand Identity Agent

Automatic logo theme selection system that analyzes a project description, determines the optimal theme (light / dark / mono / outline / inverted), and substitutes the corresponding SVG logo.

[![Express](https://img.shields.io/badge/Express-000000?style=flat-square)](https://expressjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

## Features

- 5 logo themes: light, dark, mono, mono-dark, outline, outline-dark, inverted (7 SVG variants)
- Keyword-based content detection across 5 rule sets for automatic theme selection
- 14 dark UI trigger keys with automatic theme adaptation (light -> dark, mono -> mono-dark, outline -> outline-dark)
- CLI interface for theme resolution from project description text
- Automatic CI integration via GitHub Actions -- reads `description` from `package.json` and injects SVG into README
- Git hook for adding logo to every commit body (visible in `git log --format=full`)
- HTTP API for generating email signatures with the correct logo theme
- npm module export for programmatic use in other projects

## Tech Stack

- **Runtime** - Node.js
- **Server** - Express
- **Graphics** - SVG
- **Automation** - Shell scripts, GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+ or Bun

### Installation

```bash
git clone https://github.com/stsgs1980/agent-logo.git
cd agent-logo
bun install
```

### Run

```bash
node scripts/logo-agent.js "project description" [mode]
```

Modes: `auto` (default) | `dark` | `light`

```bash
node scripts/logo-agent.js "Dark AI platform" auto
# -> dark

node scripts/logo-agent.js "Educational platform" auto
# -> light

node scripts/logo-agent.js "Educational platform" dark
# -> dark  (forced)
```

### Embed into an existing project

```bash
git clone https://github.com/stsgs1980/agent-logo.git /tmp/LOGO
cd your-project
cp -r /tmp/LOGO/scripts/ /tmp/LOGO/logos/ .
bash scripts/setup.sh
```

`setup.sh` automatically checks dependencies (node, jq), installs the git hook `prepare-commit-msg`, reads `description` from `package.json`, and determines the logo theme for the project.

### Use as npm module

```json
{
  "dependencies": {
    "logo-agent": "github:stsgs1980/agent-logo"
  }
}
```

```bash
bun install
```

```js
var logo = require('logo-agent/scripts/logo-agent');
var theme = logo.resolve(
  logo.detectContent('Dark AI platform'),
  logo.detectDarkUI('Dark AI platform'),
  'auto'
);
// theme === 'dark'
```

## API Reference

### CLI

```bash
node scripts/logo-agent.js "description" [mode]
```

### HTTP API (Express)

Embed into your Express server to generate email signatures:

```js
var logoAgent = require('./scripts/logo-agent');

app.get('/api/signature', function(req, res) {
    var content = logoAgent.detectContent(req.query.project || '');
    var dark    = logoAgent.detectDarkUI(req.query.project || '');
    var theme   = logoAgent.resolve(content, dark, req.query.mode || 'auto');
    // ... read SVG, build HTML table signature
    res.type('html').send(signatureHtml);
});
```

### Detection algorithm

1. Description text is checked against 5 keyword sets (`contentRules`)
2. The set with the most matches determines the theme: light / dark / mono / outline / inverted
3. If dark UI triggers are found (14 keys in `darkUIKeys`), the theme adapts via `darkAdapt`
4. Manual mode (`dark` / `light`) overrides auto-detection

### Adaptation map

| Light UI | | Dark UI | |
|----------|---|---------|---|
| light | -> light | light | -> dark |
| mono | -> mono | mono | -> mono-dark |
| outline | -> outline | outline | -> outline-dark |
| inverted | -> inverted | inverted | -> inverted |
| dark | -> light | dark | -> dark |

## Project Structure

- `scripts/logo-agent.js` - Core: 5 themes, 14 triggers, resolve()
- `scripts/setup.sh` - Automatic installation into a project
- `scripts/prepare-commit-msg` - Git hook: logo in commit body
- `logos/light.svg` - White background, graphite text
- `logos/dark.svg` - Dark background, white text
- `logos/mono.svg` - Monochrome, white background
- `logos/mono-dark.svg` - Monochrome, dark background
- `logos/outline.svg` - Outline, white background
- `logos/outline-dark.svg` - Outline, dark background
- `logos/inverted.svg` - Coral background, inverted colors
- `server.js` - Express server: /api/signature + /api/logo-theme
- `.github/workflows/logo.yml` - CI: SVG in README by description

## Adding a New Theme

1. Add keywords to `contentRules` in `scripts/logo-agent.js`
2. Add a variant to `darkAdapt` / `lightAdapt`
3. Create `logos/<theme>.svg`
4. All other files pick it up automatically

## License

[MIT](LICENSE)

---
Built with: Node.js + Express