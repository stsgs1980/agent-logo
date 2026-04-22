#!/usr/bin/env bash
#
# setup.sh — Установка logo-agent в текущий репозиторий
#
# Использование:
#   bash scripts/setup.sh          # из репозитория LOGO
#   bash path/to/LOGO/setup.sh     # из другого проекта
#
# Что делает:
#   1. Устанавливает git-хук prepare-commit-msg
#   2. Проверяет наличие jq и node
#   3. Проверяет description в package.json

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"

if [ -z "$REPO_ROOT" ]; then
    echo "Ошибка: не внутри git-репозитория"
    exit 1
fi

cd "$REPO_ROOT"

echo "=== Logo Agent Setup ==="
echo "Репозиторий: $REPO_ROOT"
echo ""

# Проверка зависимостей
echo "Проверка зависимостей..."

if ! command -v node >/dev/null 2>&1; then
    echo "  ✗ node не найден — нужен для logo-agent.js"
    exit 1
else
    echo "  ✓ node $(node --version)"
fi

if ! command -v jq >/dev/null 2>&1; then
    echo "  ✗ jq не найден — нужен для git-хука"
    echo "    Установите: brew install jq / apt install jq"
else
    echo "  ✓ jq $(jq --version)"
fi

# Проверка файлов
echo ""
echo "Проверка файлов..."

if [ -f "scripts/logo-agent.js" ]; then
    echo "  ✓ scripts/logo-agent.js"
else
    echo "  ✗ scripts/logo-agent.js не найден"
    echo "    Скопируйте: cp -r scripts/ $REPO_ROOT/scripts/"
    exit 1
fi

if [ -d "logos/" ]; then
    COUNT=$(ls logos/*.svg 2>/dev/null | wc -l)
    echo "  ✓ logos/ ($COUNT SVG файлов)"
else
    echo "  ✗ logos/ не найдена"
    echo "    Скопируйте: cp -r logos/ $REPO_ROOT/logos/"
    exit 1
fi

# Проверка description
echo ""
echo "Проверка package.json..."

if [ -f "package.json" ]; then
    DESC="$(jq -r '.description // ""' package.json)"
    if [ -z "$DESC" ]; then
        echo "  ⚠ description пустой — добавьте:"
        echo "    jq '. + {description: \"Описание проекта\"}' package.json > tmp.json && mv tmp.json package.json"
    else
        echo "  ✓ description: \"$DESC\""
    fi
else
    echo "  ⚠ package.json не найден"
fi

# Установка git-хука
echo ""
echo "Установка git-хука..."

if [ -f "scripts/prepare-commit-msg" ]; then
    cp scripts/prepare-commit-msg .git/hooks/prepare-commit-msg
    chmod +x .git/hooks/prepare-commit-msg
    echo "  ✓ .git/hooks/prepare-commit-msg установлен"
else
    echo "  ✗ scripts/prepare-commit-msg не найден"
fi

# Проверка CI
echo ""
echo "Проверка CI..."

if [ -f ".github/workflows/logo.yml" ]; then
    echo "  ✓ .github/workflows/logo.yml"
else
    echo "  ⚠ .github/workflows/logo.yml не найден"
    echo "    Скопируйте: mkdir -p .github/workflows && cp logo.yml .github/workflows/"
fi

# Тест
echo ""
echo "Тест детекции..."

THEME="$(node scripts/logo-agent.js "$(jq -r '.description // ""' package.json)" auto 2>/dev/null || echo "ошибка")"
echo "  Тема для текущего проекта: $THEME"

echo ""
echo "=== Setup завершён ==="
echo ""
echo "Теперь логотип автоматически:"
echo "  • подставляется в README при push (CI)"
echo "  • добавляется в тело коммита (git hook)"
echo "  • отдаётся по HTTP (server.js)"
