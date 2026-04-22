/**
 * server.js
 *
 * HTTP-эндпоинт, возвращающий готовую HTML-подпись с логотипом.
 * Подключается к существующему Express-приложению или запускается автономно.
 *
 * Эндпоинт:
 *   GET /api/signature?project=<описание>&name=<имя>&role=<роль>&email=<почта>&phone=<телефон>
 *
 * Параметры:
 *   project — описание проекта (для определения логотипа)
 *   name    — имя сотрудника
 *   role    — должность
 *   email   — электронная почта
 *   phone   — телефон
 *   mode    — 'auto' | 'dark' | 'light' (переопределение темы логотипа)
 */

'use strict';

var path       = require('path');
var fs         = require('fs');
var express    = require('express');

// Подключение модуля logo-agent
var logoAgent  = require('./scripts/logo-agent');
var detectContent = logoAgent.detectContent;
var detectDarkUI  = logoAgent.detectDarkUI;
var resolve       = logoAgent.resolve;

var app = express();
var PORT = process.env.PORT || 3000;

// Папка с SVG-логотипами
var LOGOS_DIR = path.join(__dirname, 'logos');

// ──────────────────────────────────────────────
// Чтение SVG-файла логотипа по имени темы
// ──────────────────────────────────────────────

function readLogoSvg(theme) {
    var safeTheme = theme.replace(/[^a-z0-9\-]/gi, '');
    var filePath  = path.join(LOGOS_DIR, safeTheme + '.svg');

    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        // Fallback на light.svg если запрошенный не найден
        var fallback = path.join(LOGOS_DIR, 'light.svg');
        try {
            return fs.readFileSync(fallback, 'utf8');
        } catch (e2) {
            return '<!-- logo not found -->';
        }
    }
}

// ──────────────────────────────────────────────
// Генерация HTML таблицы email-подписи
// ──────────────────────────────────────────────

function sigHTML(logoSvg, query) {
    var name  = query.name  || '';
    var role  = query.role  || '';
    var email = query.email || '';
    var phone = query.phone || '';

    return '<table cellpadding="0" cellspacing="0"'
      + ' style="border-top:2px solid #FA3913;padding-top:10px;font-family:Arial,sans-serif">'
      + '<tr>'
      + '<td style="padding-right:14px;vertical-align:middle">'
      + logoSvg
      + '</td>'
      + '<td style="vertical-align:middle">'
      + '<div style="font-size:15px;font-weight:bold;color:#343439">' + name + '</div>'
      + '<div style="font-size:12px;color:#999;margin-top:2px">' + role + '</div>'
      + '<div style="font-size:11px;color:#bbb;margin-top:4px">'
      + email + ' | ' + phone
      + '</div>'
      + '</td></tr></table>';
}

// ──────────────────────────────────────────────
// Эндпоинт подписи
// ──────────────────────────────────────────────

app.get('/api/signature', function (req, res) {
    var project = req.query.project || '';
    var mode    = req.query.mode    || 'auto';

    var content = detectContent(project);
    var dark    = detectDarkUI(project);
    var theme   = resolve(content, dark, mode);
    var logoSvg = readLogoSvg(theme);

    var html = sigHTML(logoSvg, req.query);

    res.type('html');
    res.send(html);
});

// ──────────────────────────────────────────────
// Эндпоинт для получения только темы логотипа (JSON)
// ──────────────────────────────────────────────

app.get('/api/logo-theme', function (req, res) {
    var project = req.query.project || '';
    var mode    = req.query.mode    || 'auto';

    var content = detectContent(project);
    var dark    = detectDarkUI(project);
    var theme   = resolve(content, dark, mode);

    res.json({
        project: project,
        content: content,
        darkUI:  dark,
        mode:    mode,
        theme:   theme
    });
});

// ──────────────────────────────────────────────
// Запуск сервера
// ──────────────────────────────────────────────

if (require.main === module) {
    app.listen(PORT, function () {
        console.log('Logo signature server running on http://localhost:' + PORT);
        console.log('  GET /api/signature?project=...&name=...&role=...&email=...&phone=...');
        console.log('  GET /api/logo-theme?project=...&mode=auto');
    });
}

module.exports = { app: app, sigHTML: sigHTML, readLogoSvg: readLogoSvg };
