#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-python}"

section() { printf "\n== %s ==\n" "$1"; }
info() { printf "[info] %s\n" "$1"; }
warn() { printf "[warn] %s\n" "$1"; }

section "Controller dependencies"
cd "$ROOT_DIR/controller"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  printf "Python is required. Install Python 3.10+ and rerun this script.\n" >&2
  exit 1
fi
if [[ ! -d .venv ]]; then
  info "Creating controller virtualenv at controller/.venv"
  "$PYTHON_BIN" -m venv .venv
else
  info "Using existing controller/.venv"
fi
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --upgrade pip >/dev/null
python -m pip install -e '.[dev]'

section "Frontend dependencies"
cd "$ROOT_DIR/frontend"
if ! command -v npm >/dev/null 2>&1; then
  printf "npm is required. Install Node.js 18+ and rerun this script.\n" >&2
  exit 1
fi
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

section "Optional runtime tools"
if command -v vllm >/dev/null 2>&1; then
  info "vLLM CLI found: $(vllm --version 2>/dev/null || true)"
else
  warn "vLLM CLI was not found. The UI still opens, but loading local models needs vLLM installed."
  warn "Install later with: pip install vllm"
fi
if command -v nvidia-smi >/dev/null 2>&1; then
  info "NVIDIA tools found."
else
  warn "nvidia-smi was not found. GPU status cards may be limited on this machine."
fi

section "Done"
printf "Run ./scripts/dev.sh to start the beta stack.\n"
