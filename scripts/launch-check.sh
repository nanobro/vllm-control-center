#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8787}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
API_BASE="${VLLMCC_API_BASE:-http://127.0.0.1:$BACKEND_PORT}"
FAILURES=0
WARNINGS=0

pass() { printf "[pass] %s\n" "$1"; }
warn() { printf "[warn] %s\n" "$1"; WARNINGS=$((WARNINGS + 1)); }
fail() { printf "[fail] %s\n" "$1"; FAILURES=$((FAILURES + 1)); }
section() { printf "\n== %s ==\n" "$1"; }

port_state() {
  local port="$1"
  python - "$port" <<'PY'
import socket, sys
port = int(sys.argv[1])
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(0.25)
try:
    code = s.connect_ex(("127.0.0.1", port))
finally:
    s.close()
print("busy" if code == 0 else "free")
PY
}

section "Install state"
if [[ -d "$ROOT_DIR/controller/.venv" ]]; then pass "controller virtualenv exists"; else warn "controller/.venv missing; run ./scripts/bootstrap.sh"; fi
if [[ -d "$ROOT_DIR/frontend/node_modules" ]]; then pass "frontend dependencies installed"; else warn "frontend/node_modules missing; run ./scripts/bootstrap.sh"; fi
if [[ -f "$ROOT_DIR/frontend/package-lock.json" ]]; then pass "frontend lockfile exists"; else warn "frontend/package-lock.json missing"; fi

section "Ports"
backend_state="$(port_state "$BACKEND_PORT")"
frontend_state="$(port_state "$FRONTEND_PORT")"
if [[ "$backend_state" == "busy" ]]; then warn "backend port $BACKEND_PORT is already in use"; else pass "backend port $BACKEND_PORT is free"; fi
if [[ "$frontend_state" == "busy" ]]; then warn "frontend port $FRONTEND_PORT is already in use"; else pass "frontend port $FRONTEND_PORT is free"; fi

section "Live controller"
if command -v curl >/dev/null 2>&1; then
  if curl -fsS "$API_BASE/api/health" >/tmp/vllmcc_launch_health.json 2>/dev/null; then
    pass "controller responds at $API_BASE"
  else
    warn "controller is not responding at $API_BASE; start ./scripts/dev.sh"
  fi
else
  warn "curl missing; skipped live controller check"
fi

section "Start commands"
printf "Fresh install: ./scripts/bootstrap.sh\n"
printf "Run app:       ./scripts/dev.sh\n"
printf "Check app:     ./scripts/launch-check.sh\n"

section "Summary"
if [[ "$FAILURES" -gt 0 ]]; then
  printf "%s failure(s), %s warning(s).\n" "$FAILURES" "$WARNINGS"
  exit 1
fi
printf "Launch check finished with %s warning(s).\n" "$WARNINGS"
