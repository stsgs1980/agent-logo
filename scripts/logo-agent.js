/**
 * logo-agent.js
 *
 * Модуль определения подходящего логотипа по текстовому описанию проекта.
 * Используется сервером, CI-воркфлоу и git-хуком.
 *
 * Экспортирует:
 *   - contentRules  : объект с ключевыми словами для каждой темы
 *   - darkUIKeys    : массив триггеров тёмного UI
 *   - darkAdapt     : карта прямой адаптации (светлая тема → тёмная)
 *   - lightAdapt    : карта обратной адаптации (тёмная тема → светлая)
 *   - resolve(content, darkUI, mode) : выбор варианта логотипа
 *   - detectContent(desc)            : определение темы по описанию
 *   - detectDarkUI(desc)             : определение тёмного UI по описанию
 */

'use strict';

// ──────────────────────────────────────────────
// 1. Ключевые слова для каждой контентной темы
// ──────────────────────────────────────────────

var contentRules = {
    light: [
        'образование', 'education', 'обучен', 'курс', 'course',
        'школа', 'school', 'университет', 'university', 'учеб',
        'студенч', 'student', 'преподав', 'учитель', 'teacher',
        'школьн', 'академи', 'academy', 'лекци', 'lecture',
        'тренажёр', 'трениров', 'training', 'методич', 'учебник',
        'textbook', 'наставник', 'ментор', 'mentor', 'репетитор',
        'дошкольн', 'детски', 'воспитан', 'просвещен', 'enlighten'
    ],
    dark: [
        'ai', 'ии', 'искусственн', 'нейро', 'neuro',
        'ml', 'machine learning', 'глубок', 'deep',
        'data science', 'data', 'данн', 'analytics', 'аналити',
        'платформ', 'platform', 'saas', 'cloud', 'облачн',
        'генераци', 'generation', 'автоматиз', 'automation',
        'алгоритм', 'algorithm', 'модел', 'model',
        'predict', 'предсказ', 'robot', 'робот', 'кибер', 'cyber',
        'блокчейн', 'blockchain', 'crypto', 'крипто'
    ],
    mono: [
        'минимал', 'minimal', 'консол', 'console', 'cli',
        'терминал', 'terminal', 'devops', 'инфраструктур',
        'infrastructure', 'server', 'сервер', 'deploy', 'депло',
        'docker', 'container', 'контейнер', 'kubernetes', 'k8s',
        'ci/cd', 'pipeline', 'пайплайн', 'мониторинг', 'monitoring',
        'лог', 'log', 'ssh', 'vpn', 'proxy', 'прокси'
    ],
    outline: [
        'дизайн', 'design', 'креатив', 'creative', 'арт',
        'art', 'иллюстрац', 'illustration', 'график', 'graphic',
        'ui/ux', 'интерфейс', 'interface', 'макет', 'mockup',
        'прототип', 'prototype', 'figma', 'sketch', 'стиль',
        'style', 'бренд', 'brand', 'айдентика', 'identity',
        'типограф', 'typography', 'верстк', 'layout'
    ],
    inverted: [
        'безопасн', 'security', 'защит', 'protect',
        'firewall', 'файрвол', 'антивирус', 'antivirus',
        'шифрован', 'encrypt', 'аудит', 'audit', 'compliance',
        'соответств', 'приватн', 'privacy', 'gdpr',
        'vulnerability', 'уязвим', 'pentest', 'пенетрац',
        'инцидент', 'incident', 'threat', 'угроз', 'forensic'
    ]
};

// ──────────────────────────────────────────────
// 2. Триггеры тёмного интерфейса (14 ключей)
// ──────────────────────────────────────────────

var darkUIKeys = [
    'тёмн', 'темн', 'dark',
    'ночь', 'night', 'ночн',
    'чёрн', 'черн', 'black',
    'shadow', 'тень',
    'mode', 'режим',
    'oled', 'amoled',
    'obsidian', 'onyx'
];

// ──────────────────────────────────────────────
// 3. Карта прямой адаптации: светлая тема → тёмная
//    Когда UI тёмный, светлая тема заменяется на тёмный вариант
// ──────────────────────────────────────────────

var darkAdapt = {
    light:    'dark',
    mono:     'mono-dark',
    outline:  'outline-dark'
};

// ──────────────────────────────────────────────
// 4. Карта обратной адаптации: тёмная тема → светлая
//    Когда UI светлый, тёмная тема заменяется на светлый вариант
// ──────────────────────────────────────────────

var lightAdapt = {
    'dark':         'light',
    'mono-dark':    'mono',
    'outline-dark': 'outline'
};

// ──────────────────────────────────────────────
// 5. Определение контентной темы по описанию
// ──────────────────────────────────────────────

function detectContent(desc) {
    var lower = desc.toLowerCase();
    var rules = {
        light:    contentRules.light,
        dark:     contentRules.dark,
        mono:     contentRules.mono,
        outline:  contentRules.outline,
        inverted: contentRules.inverted
    };
    var best = { theme: 'light', score: 0 };
    for (var name in rules) {
        var score = rules[name].reduce(function (s, kw) {
            return s + (lower.indexOf(kw.toLowerCase()) !== -1 ? 1 : 0);
        }, 0);
        if (score > best.score) best = { theme: name, score: score };
    }
    return best.theme;
}

// ──────────────────────────────────────────────
// 6. Определение тёмного UI по описанию
// ──────────────────────────────────────────────

function detectDarkUI(desc) {
    var lower = desc.toLowerCase();
    return darkUIKeys.some(function (k) {
        return lower.indexOf(k.toLowerCase()) !== -1;
    });
}

// ──────────────────────────────────────────────
// 7. Разрешение варианта логотипа
//    content — тема из detectContent
//    darkUI  — true/false из detectDarkUI
//    mode    — 'auto' | 'dark' | 'light' (ручной override)
// ──────────────────────────────────────────────

function resolve(content, darkUI, mode) {
    // Ручной override имеет приоритет
    if (mode === 'dark')  darkUI = true;
    if (mode === 'light') darkUI = false;

    // Если UI тёмный — адаптируем светлые темы
    if (darkUI) {
        return darkAdapt[content] || content;
    }

    // Если UI светлый — адаптируем тёмные темы
    return lightAdapt[content] || content;
}

// ──────────────────────────────────────────────
// Экспорт
// ──────────────────────────────────────────────

module.exports = {
    contentRules:  contentRules,
    darkUIKeys:    darkUIKeys,
    darkAdapt:     darkAdapt,
    lightAdapt:    lightAdapt,
    resolve:       resolve,
    detectContent: detectContent,
    detectDarkUI:  detectDarkUI
};

// ──────────────────────────────────────────────
// CLI-точка входа
// ──────────────────────────────────────────────

if (require.main === module) {
    var desc = process.argv[2] || '';
    var mode = process.argv[3] || 'auto';
    var content = detectContent(desc);
    var dark = detectDarkUI(desc);
    console.log(resolve(content, dark, mode));
}
