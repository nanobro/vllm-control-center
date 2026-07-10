#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILURES=0
WARNINGS=0

pass() { printf "[pass] %s\n" "$1"; }
warn() { printf "[warn] %s\n" "$1"; WARNINGS=$((WARNINGS + 1)); }
fail() { printf "[fail] %s\n" "$1"; FAILURES=$((FAILURES + 1)); }
section() { printf "\n== %s ==\n" "$1"; }
need_file() {
  if [[ -e "$ROOT_DIR/$1" ]]; then pass "$1 exists"; else fail "$1 is missing"; fi
}
need_text() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if grep -Eq "$pattern" "$ROOT_DIR/$file"; then pass "$label"; else fail "$label"; fi
}

section "Bug-bash release files"
need_file "docs/BETA_BUG_BASH.md"
need_file "docs/releases/BETA_BUG_BASH_STATUS.md"
need_file "docs/releases/PUBLIC_BETA_RELEASE_NOTES.md"
need_file "docs/releases/KNOWN_LIMITATIONS.md"
need_file "docs/releases/ISSUE_INTAKE.md"
need_file ".github/ISSUE_TEMPLATE/beta_feedback.md"
need_file "docs/releases/DESKTOP_PACKAGING_DECISION.md"
need_file "docs/V0_25_VERSION_SCHEME_AUDIT.md"
need_file "docs/V0_26_BETA_FEEDBACK_FIX_LANE.md"
need_file "docs/V0_28_MODEL_LIBRARY_BETA_FIX_PASS.md"
need_file "docs/V0_36_LOW_VRAM_RETRY_CONFIDENCE.md"
need_file "docs/V0_43_STREAMING_TEST_FAILURE_GUIDANCE.md"
need_file "docs/V0_47_TESTED_MODEL_NAME_HANDOFF_CLARITY.md"
need_file "docs/V0_51_CLIPBOARD_FALLBACK_HANDOFF_RELIABILITY.md"
need_file "docs/V0_52_MANUAL_COPY_FALLBACK_PREVIEW.md"
need_file "docs/V0_53_MANUAL_COPY_SELECT_ALL_CONFIDENCE.md"
need_file "docs/V0_55_LONG_MODEL_ID_OVERFLOW_POLISH.md"
need_file "docs/V0_56_VISIBLE_VERSION_BADGE_SYNC.md"
need_file "docs/V0_57_PLAYGROUND_LOADED_MODEL_SOURCE_OF_TRUTH.md"
need_file "docs/V0_58_PLAYGROUND_SERVED_NAME_AUTO_RETRY.md"
need_file "docs/V0_62_GITHUB_PUBLIC_REPO_CLEANUP.md"
need_file "docs/releases/BETA_FEEDBACK_FIX_LANE.md"
need_file "scripts/version-scheme-check.sh"
need_file "scripts/release-freeze-check.sh"

section "Beta scope guardrails"
need_text "README.md" "web-first|browser UI" "README states the web-first beta path"
need_text "docs/releases/BETA_BUG_BASH_STATUS.md" "Blocker" "bug-bash status defines blocker severity"
need_text "docs/releases/BETA_BUG_BASH_STATUS.md" "v0\.62" "bug-bash status points to v0.62 lane"
need_text "docs/releases/DESKTOP_PACKAGING_DECISION.md" "preview-only|preview only|preview shell" "desktop decision remains preview-only"
need_text "docs/MILESTONES.md" "v0\.25" "milestones include v0.25 history"
need_text "docs/MILESTONES.md" "v0\.62" "milestones include v0.62 GitHub public repo cleanup lane"
need_text "frontend/src/pages/App.tsx" "APP_VERSION_LABEL" "sidebar beta badge uses current app version label"
need_text "frontend/src/pages/PlaygroundPage.tsx" "Loaded model" "playground lists loaded local models"
need_text "frontend/src/api/client.ts" "stream_first_token_timeout" "first-token timeout guidance is wired"
need_text "frontend/src/api/client.ts" "stream_inactivity_timeout" "inactivity timeout guidance is wired"
need_text "controller/app/api/playground.py" "_connect_host" "playground backend normalizes wildcard hosts"
need_text "frontend/src/pages/PlaygroundPage.tsx" "displayHost" "playground shows localhost for wildcard local endpoints"
need_text "frontend/src/pages/ServerPage.tsx" "Test this model" "run model exposes direct test panel"
need_text "frontend/src/pages/ServerPage.tsx" "starterTestPrompts" "run model has starter test prompts"

section "Daily mode freeze"
if grep -RInE "Generic chat|Chat UI|Chat page|Assistant chat" "$ROOT_DIR/frontend/src" >/tmp/vllmcc_bugbash_chat_hits.txt; then
  cat /tmp/vllmcc_bugbash_chat_hits.txt
  fail "generic chat surface appears in live frontend copy"
else
  pass "no generic chat surface found in live frontend copy"
fi

if grep -RInE "v2[0-3]\\.[0-9]+|v22 beta|v23 beta|setup doctor" "$ROOT_DIR/frontend/src" >/tmp/vllmcc_bugbash_stale_hits.txt; then
  cat /tmp/vllmcc_bugbash_stale_hits.txt
  fail "stale milestone wording found in live frontend copy"
else
  pass "no stale milestone wording found in live frontend copy"
fi

section "Screenshot readiness"
if [[ -x "$ROOT_DIR/scripts/check-screenshots.sh" ]]; then
  "$ROOT_DIR/scripts/check-screenshots.sh"
else
  fail "scripts/check-screenshots.sh is missing or not executable"
fi

section "Summary"
if [[ "$FAILURES" -gt 0 ]]; then
  printf "%s failure(s), %s warning(s).\n" "$FAILURES" "$WARNINGS"
  exit 1
fi
printf "Bug-bash check passed with %s warning(s).\n" "$WARNINGS"
