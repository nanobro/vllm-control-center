#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_BASE="${VLLMCC_FRONTEND_BASE:-http://127.0.0.1:5173}"
OUT_DIR="$ROOT_DIR/docs/screenshots"
CHROMIUM_BIN="${CHROMIUM_BIN:-}"
CDP_PORT="${VLLMCC_SCREENSHOT_CDP_PORT:-9222}"
CHROME_PROFILE="${VLLMCC_SCREENSHOT_PROFILE:-/tmp/vllmcc-screenshot-chrome}"

if [[ -z "$CHROMIUM_BIN" ]]; then
  for candidate in chromium chromium-browser google-chrome chrome; do
    if command -v "$candidate" >/dev/null 2>&1; then
      CHROMIUM_BIN="$(command -v "$candidate")"
      break
    fi
  done
fi

if [[ -z "$CHROMIUM_BIN" ]]; then
  echo "Could not find Chromium/Chrome. Install chromium or set CHROMIUM_BIN." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to check the frontend before capture." >&2
  exit 1
fi

if ! curl -fsS "$FRONTEND_BASE" >/dev/null 2>&1; then
  cat >&2 <<MSG
Frontend is not reachable at $FRONTEND_BASE.
Start the app first:

  ./scripts/dev.sh

Then run:

  ./scripts/capture-screenshots.sh
MSG
  exit 1
fi

mkdir -p "$OUT_DIR"
rm -rf "$CHROME_PROFILE"

"$CHROMIUM_BIN" \
  --headless=new \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  --remote-debugging-port="$CDP_PORT" \
  --remote-allow-origins=* \
  --user-data-dir="$CHROME_PROFILE" \
  about:blank >/tmp/vllmcc_screenshot_chromium.log 2>&1 &
CHROME_PID=$!
cleanup() {
  kill "$CHROME_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$CDP_PORT/json/version" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

python3 - "$FRONTEND_BASE" "$OUT_DIR" "$CDP_PORT" <<'PY'
import base64
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

import websocket

frontend_base = sys.argv[1].rstrip('/')
out_dir = Path(sys.argv[2])
cdp_port = sys.argv[3]

captures = [
    ('01-run-model.png', 'server', 'daily'),
    ('02-models.png', 'models-library', 'daily'),
    ('03-endpoint-success.png', 'server', 'daily'),
    ('04-remote.png', 'remote', 'daily'),
    ('05-setup-check.png', 'setup', 'advanced'),
]

def new_tab(url: str):
    endpoint = f"http://127.0.0.1:{cdp_port}/json/new?{urllib.parse.quote(url, safe=':/?&=')}"
    req = urllib.request.Request(endpoint, method='PUT')
    return json.loads(urllib.request.urlopen(req, timeout=10).read())

for filename, page, mode in captures:
    url = f"{frontend_base}/?page={page}&mode={mode}"
    print(f"Capturing {filename} from {url}")
    info = new_tab(url)
    ws = websocket.create_connection(info['webSocketDebuggerUrl'], timeout=10)
    counter = 0

    def send(method, params=None):
        nonlocal_counter = None
        nonlocal_vars = send.__dict__
        nonlocal_vars['counter'] = nonlocal_vars.get('counter', 0) + 1
        msg_id = nonlocal_vars['counter']
        ws.send(json.dumps({'id': msg_id, 'method': method, 'params': params or {}}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get('id') == msg_id:
                if 'error' in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg

    send('Page.enable')
    send('Emulation.setDeviceMetricsOverride', {
        'width': 1440,
        'height': 1000,
        'deviceScaleFactor': 1,
        'mobile': False,
    })
    time.sleep(4)
    text_result = send('Runtime.evaluate', {
        'expression': 'document.body ? document.body.innerText : ""',
        'returnByValue': True,
    })
    page_text = text_result.get('result', {}).get('result', {}).get('value', '') or ''
    if ' is blocked' in page_text and "organization doesn't allow" in page_text:
        raise RuntimeError(
            'Chromium blocked local screenshot capture in this environment. '
            'Keep the placeholder PNGs and rerun on a normal dev machine.'
        )
    result = send('Page.captureScreenshot', {
        'format': 'png',
        'captureBeyondViewport': False,
    })
    (out_dir / filename).write_bytes(base64.b64decode(result['result']['data']))
    ws.close()
PY

"$ROOT_DIR/scripts/check-screenshots.sh"

echo "Screenshots captured in docs/screenshots/. Review them for secrets before publishing."
