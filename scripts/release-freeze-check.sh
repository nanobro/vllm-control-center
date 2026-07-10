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
need_exec() {
  if [[ -x "$ROOT_DIR/$1" ]]; then pass "$1 is executable"; else fail "$1 is missing or not executable"; fi
}
need_text() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if grep -Eq "$pattern" "$ROOT_DIR/$file"; then pass "$label"; else fail "$label"; fi
}
no_text() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if grep -Eq "$pattern" "$ROOT_DIR/$file"; then fail "$label"; else pass "$label"; fi
}

section "v0.62 release files"
need_file "docs/V0_25_VERSION_SCHEME_AUDIT.md"
need_file "docs/V0_26_BETA_FEEDBACK_FIX_LANE.md"
need_file "docs/V0_28_MODEL_LIBRARY_BETA_FIX_PASS.md"
need_file "docs/V0_36_LOW_VRAM_RETRY_CONFIDENCE.md"
need_file "docs/V0_43_STREAMING_TEST_FAILURE_GUIDANCE.md"
need_file "docs/V0_45_SUGGESTED_SERVED_NAME_RETRY.md"
need_file "docs/V0_46_AUTO_SERVED_NAME_RETRY.md"
need_file "docs/V0_47_TESTED_MODEL_NAME_HANDOFF_CLARITY.md"
need_file "docs/V0_51_CLIPBOARD_FALLBACK_HANDOFF_RELIABILITY.md"
need_file "docs/V0_52_MANUAL_COPY_FALLBACK_PREVIEW.md"
need_file "docs/V0_53_MANUAL_COPY_SELECT_ALL_CONFIDENCE.md"
need_file "docs/V0_55_LONG_MODEL_ID_OVERFLOW_POLISH.md"
need_file "docs/V0_56_VISIBLE_VERSION_BADGE_SYNC.md"
need_file "docs/V0_57_PLAYGROUND_LOADED_MODEL_SOURCE_OF_TRUTH.md"
need_file "docs/V0_58_PLAYGROUND_SERVED_NAME_AUTO_RETRY.md"
need_file "docs/V0_61_EASY_TEST_FLOW_UX.md"
need_file "docs/V0_62_GITHUB_PUBLIC_REPO_CLEANUP.md"
need_file "docs/GITHUB_RELEASE_CHECKLIST.md"
need_file "docs/archive/internal-history/V24_0_PUBLIC_BETA_FREEZE.md"
need_file "docs/archive/agent-prompts/V24_0_AGENT_PROMPTS.md"
need_file "docs/VERSION_NUMBER_CHANGE_BRIEF.md"
need_file "docs/releases/BETA_FEEDBACK_FIX_LANE.md"
need_file "docs/releases/BETA_BUG_BASH_STATUS.md"
need_file "docs/releases/PUBLIC_BETA_RELEASE_NOTES.md"
need_file "docs/releases/KNOWN_LIMITATIONS.md"
need_file "docs/releases/ISSUE_INTAKE.md"
need_file "docs/releases/DESKTOP_PACKAGING_DECISION.md"
need_file "docs/MILESTONES.md"
need_file "docs/BETA_BUG_BASH.md"
need_file "docs/screenshots/MANIFEST.md"
need_file "docs/screenshots/CAPTIONS.md"
need_file "ai-agent-prompts/NEXT_AGENT_PROMPTS.md"
need_exec "scripts/version-scheme-check.sh"

section "Version agreement"
need_text "README.md" "Current release: v0\.62" "README current release is v0.62"
need_text "ROADMAP.md" "Current package: v0\.62" "ROADMAP current package is v0.62"
need_text "CHANGELOG.md" "^## v0\.62" "CHANGELOG starts with v0.62"
need_text "docs/MILESTONES.md" "v0\.62.*GitHub public repo cleanup" "milestones describe v0.62 GitHub cleanup lane"
need_text "docs/releases/BETA_BUG_BASH_STATUS.md" "v0\.62" "bug-bash status mentions v0.62"
need_text "docs/releases/BETA_BUG_BASH_STATUS.md" "Manual happy-path" "manual happy-path status is explicit"
need_text "README.md" "vllm-control-center-starter-v0\.62\.zip" "README package command uses v0.62"
need_text "ai-agent-prompts/NEXT_AGENT_PROMPTS.md" "v0\.63" "next-agent prompt points to v0.63"
need_text "frontend/src/pages/App.tsx" "APP_VERSION_LABEL" "live sidebar badge uses current version label"
need_text "frontend/src/version.ts" "packageJson.version" "frontend visible version is sourced from package metadata"
need_text "frontend/src/version.ts" "APP_VERSION_LABEL" "frontend exports visible version label"
need_text "frontend/src/pages/PlaygroundPage.tsx" "activeInstances" "playground uses active loaded/warming instances"
need_text "frontend/src/pages/PlaygroundPage.tsx" "No loaded models" "playground empty state is loaded-model based"
need_text "frontend/src/pages/PlaygroundPage.tsx" "shouldAutoRetryServedName" "playground served-name auto-retry is wired"
need_text "frontend/src/api/client.ts" "stream_timeout" "local streaming timeout guidance is wired"
need_text "frontend/src/pages/PlaygroundPage.tsx" "shouldAutoRetryServedName" "playground auto-retries served model name mismatches"
need_text "controller/app/api/playground.py" "_connect_host" "playground backend normalizes wildcard hosts"
need_text "controller/app/api/playground.py" "_endpoint_base_url" "playground backend uses normalized endpoint base URL"
need_text "frontend/src/pages/PlaygroundPage.tsx" "displayHost" "playground displays wildcard local endpoints as localhost"
need_text "frontend/src/pages/PlaygroundPage.tsx" "stopStreaming" "playground can stop stuck streaming tests"
need_text "frontend/src/api/client.ts" "stream_first_token_timeout" "playground has first-token timeout guidance"
need_text "frontend/src/api/client.ts" "stream_inactivity_timeout" "playground has stalled-token timeout guidance"
need_text "frontend/src/pages/ServerPage.tsx" "Test this model" "run model exposes direct test panel"
need_text "frontend/src/pages/ServerPage.tsx" "starterTestPrompts" "run model has starter test prompts"
need_text "frontend/src/pages/ServerPage.tsx" "chat-like-response" "run model renders readable test response"
need_text "README.md" "## Beta status" "README has beta status section"
need_text "docs/GITHUB_RELEASE_CHECKLIST.md" "Before first public push" "GitHub checklist covers first public push"
need_text "docs/V0_62_GITHUB_PUBLIC_REPO_CLEANUP.md" "docs/archive/internal-history" "v0.62 doc describes archived internal history"

section "Beta guardrails"
need_text "README.md" "web-first|browser UI" "README keeps web-first beta path"
need_text "docs/releases/DESKTOP_PACKAGING_DECISION.md" "preview-only|preview only|preview shell" "Electron remains preview-only"
need_text "docs/releases/KNOWN_LIMITATIONS.md" "Electron|desktop" "known limitations mention desktop constraints"
need_text "docs/releases/PUBLIC_BETA_RELEASE_NOTES.md" "Daily mode|Run Model|/v1" "release notes describe the daily endpoint path"
need_text "README.md" "not a generic chat UI" "README explicitly rejects generic chat positioning"

section "Required check scripts"
need_exec "scripts/launch-check.sh"
need_exec "scripts/smoke.sh"
need_exec "scripts/check-screenshots.sh"
need_exec "scripts/bug-bash-check.sh"
need_exec "scripts/check.sh"
need_exec "scripts/version-scheme-check.sh"

section "Version-scheme check"
"$ROOT_DIR/scripts/version-scheme-check.sh" || fail "version-scheme check failed"

section "Live UI freeze"
if grep -RInE "v2[0-4]\\.[0-9]+|v25\\.0|v26\\.x|v22 beta|v23 beta|setup doctor" "$ROOT_DIR/frontend/src" >/tmp/vllmcc_release_freeze_stale_hits.txt; then
  cat /tmp/vllmcc_release_freeze_stale_hits.txt
  fail "stale milestone wording found in live frontend copy"
else
  pass "no stale milestone wording found in live frontend copy"
fi

if grep -RInE "Generic chat|Chat UI|Chat page|Assistant chat" "$ROOT_DIR/frontend/src" >/tmp/vllmcc_release_freeze_chat_hits.txt; then
  cat /tmp/vllmcc_release_freeze_chat_hits.txt
  fail "generic chat surface appears in live frontend copy"
else
  pass "no generic chat surface found in live frontend copy"
fi

section "Screenshot artifacts"
for file in \
  docs/screenshots/01-run-model.png \
  docs/screenshots/02-models.png \
  docs/screenshots/03-endpoint-success.png \
  docs/screenshots/04-remote.png \
  docs/screenshots/05-setup-check.png; do
  if [[ -s "$ROOT_DIR/$file" ]]; then pass "$file exists and is non-empty"; else fail "$file is missing or empty"; fi
done


section "Public repo hygiene"
prompt_count=$(find "$ROOT_DIR/ai-agent-prompts" -maxdepth 1 -type f | wc -l | tr -d ' ')
if [[ "$prompt_count" -le 7 ]]; then pass "public agent prompt directory is trimmed"; else fail "public agent prompt directory has too many files ($prompt_count)"; fi
if [[ -d "$ROOT_DIR/docs/archive/internal-history" ]]; then pass "internal history archive exists"; else fail "internal history archive missing"; fi
if [[ -d "$ROOT_DIR/docs/archive/agent-prompts" ]]; then pass "agent prompt archive exists"; else fail "agent prompt archive missing"; fi

section "Summary"
if [[ "$FAILURES" -gt 0 ]]; then
  printf "%s failure(s), %s warning(s).\n" "$FAILURES" "$WARNINGS"
  exit 1
fi
printf "Release-freeze check passed with %s warning(s).\n" "$WARNINGS"
