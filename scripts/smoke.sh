#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_BASE="${VLLMCC_API_BASE:-http://127.0.0.1:8787}"
FAILURES=0
WARNINGS=0

pass() { printf "[pass] %s\n" "$1"; }
warn() { printf "[warn] %s\n" "$1"; WARNINGS=$((WARNINGS + 1)); }
fail() { printf "[fail] %s\n" "$1"; FAILURES=$((FAILURES + 1)); }
section() { printf "\n== %s ==\n" "$1"; }
need_file() {
  if [[ -e "$ROOT_DIR/$1" ]]; then pass "$1 exists"; else fail "$1 is missing"; fi
}
need_cmd() {
  if command -v "$1" >/dev/null 2>&1; then pass "$1 is available"; else fail "$1 is missing"; fi
}
optional_cmd() {
  if command -v "$1" >/dev/null 2>&1; then pass "$1 is available"; else warn "$1 is not installed"; fi
}

section "Repository shape"
need_file "README.md"
need_file "ROADMAP.md"
need_file "CHANGELOG.md"
need_file "Makefile"
need_file "controller/pyproject.toml"
need_file "frontend/package.json"
need_file "scripts/check.sh"
need_file "scripts/doctor.sh"
need_file "docs/BETA_BUG_BASH.md"
need_file "docs/archive/internal-history/V24_1_BUG_BASH_SMOKE_HARNESS.md"
need_file "docs/archive/internal-history/V24_2_INSTALL_LAUNCH_PATH_HARDENING.md"
need_file "docs/archive/internal-history/V24_3_BETA_DOCS_SCREENSHOT_READINESS.md"
need_file "docs/MILESTONES.md"
need_file "docs/archive/internal-history/V24_4_NEXT_VERSION_PLAN_MILESTONE_MAP.md"
need_file "docs/archive/internal-history/V24_5_SCREENSHOT_CAPTURE_README_WIRING.md"
need_file "docs/archive/internal-history/V24_6_PUBLIC_BETA_RELEASE_NOTES_ISSUE_INTAKE.md"
need_file "docs/archive/internal-history/V24_7_DESKTOP_PACKAGING_DECISION_RELEASE_PATH.md"
need_file "docs/releases/DESKTOP_PACKAGING_DECISION.md"
need_file "docs/archive/internal-history/V24_8_BETA_BUG_BASH_FIX_PASS.md"
need_file "docs/releases/BETA_BUG_BASH_STATUS.md"
need_file "scripts/bug-bash-check.sh"
need_file "docs/V0_25_VERSION_SCHEME_AUDIT.md"
need_file "docs/V0_26_BETA_FEEDBACK_FIX_LANE.md"
need_file "docs/V0_28_MODEL_LIBRARY_BETA_FIX_PASS.md"
need_file "docs/V0_36_LOW_VRAM_RETRY_CONFIDENCE.md"
need_file "docs/V0_43_STREAMING_TEST_FAILURE_GUIDANCE.md"
need_file "docs/VERSION_NUMBER_CHANGE_BRIEF.md"
need_file "docs/releases/BETA_FEEDBACK_FIX_LANE.md"
need_file "scripts/version-scheme-check.sh"
need_file "docs/archive/agent-prompts/V0_28_AGENT_PROMPTS.md"
need_file "docs/archive/agent-prompts/V0_36_AGENT_PROMPTS.md"
need_file "docs/archive/agent-prompts/V0_43_AGENT_PROMPTS.md"
need_file "scripts/release-freeze-check.sh"
need_file "ai-agent-prompts/NEXT_AGENT_PROMPTS.md"
need_file "ai-agent-prompts/V0_62_AGENT_PROMPTS.md"
need_file "docs/GITHUB_RELEASE_CHECKLIST.md"
need_file "desktop/README.md"
need_file "docs/releases/PUBLIC_BETA_RELEASE_NOTES.md"
need_file "docs/releases/KNOWN_LIMITATIONS.md"
need_file "docs/releases/ISSUE_INTAKE.md"
need_file ".github/ISSUE_TEMPLATE/beta_feedback.md"
need_file "docs/screenshots/MANIFEST.md"
need_file "scripts/capture-screenshots.sh"
need_file "scripts/check-screenshots.sh"
need_file "docs/screenshots/01-run-model.png"
need_file "docs/screenshots/02-models.png"
need_file "docs/screenshots/03-endpoint-success.png"
need_file "docs/screenshots/04-remote.png"
need_file "docs/screenshots/05-setup-check.png"
need_file "docs/screenshots/CAPTIONS.md"
need_file "docs/demo/public-beta-walkthrough.md"

section "Tooling"
need_cmd python
need_cmd node
need_cmd npm
optional_cmd vllm
optional_cmd nvidia-smi
optional_cmd curl

section "UI copy guardrails"
if grep -RInE "v2[0-4]\\.[0-9]+|v25\\.0|v26\\.x|v22 beta|v23 beta|v23\\.[0-9]+ simple|setup doctor" "$ROOT_DIR/frontend/src" >/tmp/vllmcc_smoke_copy_hits.txt; then
  cat /tmp/vllmcc_smoke_copy_hits.txt
  fail "stale milestone wording found in live frontend copy"
else
  pass "no stale milestone wording found in live frontend copy"
fi

if grep -RIn "APP_VERSION_LABEL" "$ROOT_DIR/frontend/src/pages/App.tsx" >/dev/null && grep -RIn "packageJson.version" "$ROOT_DIR/frontend/src/version.ts" >/dev/null; then
  pass "sidebar uses current package version beta badge"
else
  fail "sidebar current version beta badge is not wired"
fi

section "Controller API if running"
if command -v curl >/dev/null 2>&1; then
  if curl -fsS "$API_BASE/api/health" >/tmp/vllmcc_smoke_health.json 2>/dev/null; then
    pass "controller health endpoint responds at $API_BASE"
    for path in /api/server/qa /api/local-models /api/instances /api/downloads /api/remote-profiles; do
      if curl -fsS "$API_BASE$path" >/dev/null 2>&1; then
        pass "$path responds"
      else
        warn "$path did not respond"
      fi
    done
  else
    warn "controller is not running at $API_BASE; start ./scripts/dev.sh for live API smoke checks"
  fi
else
  warn "curl missing; skipped live controller smoke checks"
fi

section "Summary"
if [[ "$FAILURES" -gt 0 ]]; then
  printf "%s failure(s), %s warning(s).\n" "$FAILURES" "$WARNINGS"
  exit 1
fi
printf "Smoke checks passed with %s warning(s).\n" "$WARNINGS"
