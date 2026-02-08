---
id: PF-44
title: Add diff-coverage gate for new/changed code
status: To Do
assignee: []
created_date: '2026-02-07 02:32'
updated_date: '2026-02-08 10:25'
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
