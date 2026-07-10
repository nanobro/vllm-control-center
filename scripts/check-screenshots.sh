#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/docs/screenshots"
FAILURES=0

need_png() {
  local file="$1"
  local path="$OUT_DIR/$file"
  if [[ ! -s "$path" ]]; then
    echo "[fail] missing or empty docs/screenshots/$file"
    FAILURES=$((FAILURES + 1))
    return
  fi
  if command -v file >/dev/null 2>&1; then
    if file "$path" | grep -q "PNG image data"; then
      echo "[pass] docs/screenshots/$file is a PNG"
    else
      echo "[fail] docs/screenshots/$file is not a PNG"
      FAILURES=$((FAILURES + 1))
    fi
  else
    echo "[pass] docs/screenshots/$file exists"
  fi
}

need_png 01-run-model.png
need_png 02-models.png
need_png 03-endpoint-success.png
need_png 04-remote.png
need_png 05-setup-check.png

if grep -RIlE "hf_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|api[_-]?key|token" "$OUT_DIR"/*.png >/dev/null 2>&1; then
  echo "[warn] binary screenshot scan found a suspicious token-like string; review manually"
fi

if [[ "$FAILURES" -gt 0 ]]; then
  echo "$FAILURES screenshot check failure(s)."
  exit 1
fi

echo "Screenshot checks passed. Review images manually for private hostnames, paths, and tokens before release."
