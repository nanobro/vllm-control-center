#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILURES=0
WARNINGS=0

pass() { printf "[pass] %s\n" "$1"; }
warn() { printf "[warn] %s\n" "$1"; WARNINGS=$((WARNINGS + 1)); }
fail() { printf "[fail] %s\n" "$1"; FAILURES=$((FAILURES + 1)); }
section() { printf "\n== %s ==\n" "$1"; }
need_text() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if grep -Eq "$pattern" "$ROOT_DIR/$file"; then pass "$label"; else fail "$label"; fi
}

section "Public version agreement"
need_text "README.md" "Current release: v0\.62" "README points to v0.62"
need_text "ROADMAP.md" "Current package: v0\.62" "ROADMAP points to v0.62"
need_text "CHANGELOG.md" "^## v0\.62" "CHANGELOG starts with v0.62"
need_text "frontend/package.json" '"version": "0\.62\.0"' "frontend package is 0.62.0"
need_text "controller/pyproject.toml" '^version = "0\.62\.0"' "controller package is 0.62.0"
need_text "frontend/src/pages/App.tsx" "APP_VERSION_LABEL" "sidebar badge uses app version label"
need_text "frontend/src/version.ts" "packageJson.version" "frontend version label is sourced from package metadata"
need_text "docs/releases/BETA_FEEDBACK_FIX_LANE.md" "v0\.62" "feedback lane doc mentions v0.62"
need_text "docs/VERSION_NUMBER_CHANGE_BRIEF.md" "v0\.(26|27|28|29)" "version brief still instructs v0.x public beta versions"

section "Forbidden public next-version targets"
# It is okay for docs to say "do not create v25.0". It is not okay for current/next guidance
# to point the project toward the old public target scheme.
if grep -RInE "Current[^\n]*(v24\.10|v25\.0|v26\.x)|Next[^\n]*(v24\.10|v25\.0|v26\.x)|toward v25\.0|before v25\.0|after v25\.0|v25\.0 public beta|v26\.x post-beta" \
  "$ROOT_DIR/README.md" \
  "$ROOT_DIR/ROADMAP.md" \
  "$ROOT_DIR/docs/releases" \
  "$ROOT_DIR/ai-agent-prompts/NEXT_AGENT_PROMPTS.md" >/tmp/vllmcc_version_scheme_hits.txt; then
  cat /tmp/vllmcc_version_scheme_hits.txt
  fail "public-facing current/next docs still point toward old public version targets"
else
  pass "current/next docs do not point toward old public version targets"
fi

section "Historical docs"
if grep -RInE "v25\.0|v26\.x" "$ROOT_DIR/docs/archive/internal-history/V24_" "$ROOT_DIR/docs/archive/agent-prompts/V24_" >/tmp/vllmcc_version_history_hits.txt 2>/dev/null; then
  warn "old internal v24.x archived historical docs still contain old target wording; acceptable if not used as current guidance"
else
  pass "historical docs contain no old public target wording"
fi

section "Summary"
if [[ "$FAILURES" -gt 0 ]]; then
  printf "%s failure(s), %s warning(s).\n" "$FAILURES" "$WARNINGS"
  exit 1
fi
printf "Version-scheme check passed with %s warning(s).\n" "$WARNINGS"
