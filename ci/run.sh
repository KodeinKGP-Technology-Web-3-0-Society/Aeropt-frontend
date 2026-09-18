#!/usr/bin/env bash
# Local + GitHub CI for Aeropt-frontend.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules ]]; then
  echo "==> [frontend] npm install"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
fi

echo "==> [frontend] lint"
npm run lint

echo "==> [frontend] math self-test"
npm run test:math

# Renders every fixture through the real pipeline and real KaTeX: fails if any span
# would not render, or if valid maths was lost on the way. Regenerate the corpus
# fixture from the agent with `make latex-fixture`.
echo "==> [frontend] latex contract (KaTeX)"
npm run test:latex

# Renders through the real remark-math → rehype-katex pipeline and fails on any error
# node. Catches the cases a regex-based span split cannot see.
echo "==> [frontend] latex render check"
npm run test:render

echo "==> [frontend] typecheck"
npx tsc --noEmit

echo "==> [frontend] production build"
npm run build

echo "==> [frontend] CI passed"
