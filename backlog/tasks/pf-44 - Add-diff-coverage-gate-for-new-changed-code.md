---
id: PF-44
title: Add diff-coverage gate for new/changed code
status: Done
assignee: []
created_date: '2026-02-07 02:32'
updated_date: '2026-02-08 10:33'
labels:
  - infra
dependencies:
  - PF-8
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wire up diff-test-coverage (or similar) to enforce higher coverage thresholds (e.g., 90%) on new/changed lines only. Requires lcov reporter added to vitest config. Research done in PF-8 session — best Node.js option is diff-test-coverage npm package. Could also evaluate Codecov patch coverage if/when CI is added.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `diff-test-coverage` (or equivalent) installed as dev dependency
- [ ] #2 New/changed lines enforce ≥90% line coverage threshold
- [ ] #3 Gate integrated into `npm run build` (flows through pre-commit hook)
- [ ] #4 Commits touching only non-source files (backlog/, docs, config) are not blocked by the gate
- [ ] #5 lcov reporter configured in vitest config (verify/add if not already from PF-8)
- [ ] #6 Failure output clearly identifies which uncovered new/changed lines missed the threshold
- [ ] #7 `npm run build` passes
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Installed `@connectis/diff-test-coverage` and added `scripts/diff-coverage.sh` that enforces ≥90% line, ≥80% branch/function coverage on new/changed source lines. Runs after vitest coverage in `prebuild`, so it flows through the pre-commit hook. Smart diff detection (staged vs working tree). Skips cleanly for non-source commits (backlog, docs, config). Added `lcov` reporter to vitest config.
<!-- SECTION:FINAL_SUMMARY:END -->
