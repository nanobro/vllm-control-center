#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8787}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

printf "Starting vLLM Control Center dev stack...\n"
printf "Tip: run ./scripts/bootstrap.sh first on a fresh clone, or ./scripts/launch-check.sh if the app does not open.\n"
printf "Backend:  http://127.0.0.1:%s\n" "$BACKEND_PORT"
printf "Frontend: http://127.0.0.1:%s\n" "$FRONTEND_PORT"
printf "\n"

cd "$ROOT_DIR/controller"
if [[ ! -d .venv ]]; then
  printf "Creating controller virtualenv...\n"
  python -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install -e .[dev] >/dev/null
uvicorn app.main:app --reload --host 127.0.0.1 --port "$BACKEND_PORT" &
BACKEND_PID=$!

cd "$ROOT_DIR/frontend"
if [[ ! -d node_modules ]]; then
  printf "Installing frontend dependencies...\n"
  npm install
fi
VITE_API_BASE="${VITE_API_BASE:-http://127.0.0.1:$BACKEND_PORT}" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" &
FRONTEND_PID=$!

while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done

if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
  wait "$BACKEND_PID"
  exit $?
fi

wait "$FRONTEND_PID"
exit $?
