#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

printf "== Frontend build ==\n"
cd "$ROOT_DIR/frontend"
if [[ -d node_modules ]]; then
  printf "Frontend dependencies already available; skipping npm install.\n"
elif [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
npm run build

printf "\n== Backend dependency check ==\n"
cd "$ROOT_DIR/controller"
if ! python -c 'import aiosqlite, fastapi, pydantic, pytest, ruff' >/dev/null 2>&1; then
  python -m pip install -e .[dev] >/dev/null
else
  printf "Backend dependencies already available; skipping install.\n"
fi

printf "\n== Backend tests ==\n"
PYTHONPATH=. python -m pytest -q

printf "\n== Backend lint ==\n"
ruff check app tests

printf "\n== Desktop shell check ==\n"
cd "$ROOT_DIR/desktop/electron"
if [[ -d node_modules ]]; then
  printf "Desktop dependencies already available; skipping npm install.\n"
elif [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
npm run check

printf "\nAll checks passed.\n"
