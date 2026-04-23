#!/usr/bin/env bash
# Diff-coverage gate: enforce >=90% line coverage on new/changed source lines.
# Runs after vitest coverage (which produces coverage/lcov.info).
# Exits 0 if no source files are in the diff or threshold is met.

set -euo pipefail

LCOV_FILE="coverage/lcov.info"
THRESHOLD_LINE=90
THRESHOLD_BRANCH=80
THRESHOLD_FUNCTION=80

# Verify lcov report exists (vitest coverage must run first)
if [ ! -f "$LCOV_FILE" ]; then
  echo "diff-coverage: No lcov.info found — skipping diff-coverage gate."
  echo "  (Run 'npm run coverage' first to generate coverage data.)"
  exit 0
fi

# Determine the diff: staged changes (pre-commit) or HEAD vs working tree
# Use --cached if there are staged changes, otherwise compare HEAD to working tree
if git diff --cached --quiet 2>/dev/null; then
  # Nothing staged — compare HEAD to working tree (manual run outside pre-commit)
  DIFF_CMD="git diff HEAD"
else
  DIFF_CMD="git diff --cached"
fi

# Check if the diff touches any source files (src/**/*.ts, src/**/*.vue)
# Exclude Demo*.vue files (throwaway spike/demo components)
# Exclude *PrintView.vue (page-level, HITL-verified visually)
SOURCE_FILES=$($DIFF_CMD --name-only -- 'src/' ':!src/components/Demo*.vue' ':!src/components/*PrintView.vue' 2>/dev/null || true)

if [ -z "$SOURCE_FILES" ]; then
  echo "diff-coverage: No source files (src/) in diff — gate passes."
  exit 0
fi

echo "diff-coverage: Checking coverage on changed source files..."
echo "  Files: $(echo "$SOURCE_FILES" | tr '\n' ' ')"

# V8 coverage + Vue SFC compilation produces NaN hit counts on some template
# branches (uninstrumented code paths). Remove these lines so diff-test-coverage
# doesn't penalise phantom branches that can't be exercised.
CLEAN_LCOV="coverage/lcov-clean.info"
grep -v ',NaN$' "$LCOV_FILE" > "$CLEAN_LCOV"

# Run diff-test-coverage, filtering to only src/ files
# Exclude Demo*.vue (throwaway spike/demo components)
# Exclude *PrintView.vue (page-level, HITL-verified visually)
# Use || true to capture exit code despite set -e
EXIT_CODE=0
$DIFF_CMD -- 'src/' ':!src/components/Demo*.vue' ':!src/components/*PrintView.vue' | npx diff-test-coverage \
  -c "$CLEAN_LCOV" \
  -t lcov \
  -l "$THRESHOLD_LINE" \
  -b "$THRESHOLD_BRANCH" \
  -f "$THRESHOLD_FUNCTION" \
  --diff-filter '*.ts' '*.vue' \
  --log-template coverage-files-complete totals-complete errors \
  -- || EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "diff-coverage: FAILED — new/changed lines below ${THRESHOLD_LINE}% line coverage threshold."
  echo "  Add tests for uncovered lines or adjust the diff-coverage threshold."
  exit 1
fi

echo "diff-coverage: PASSED"
exit 0
