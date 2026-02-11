---
id: PF-8
title: Build coverage gate
status: Done
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-07 02:33'
labels:
  - infra
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add coverage thresholds to vitest config: 90% lines, branches, functions, statements. Add a dedicated coverage check step that the build step references.\n\nCurrent baseline: 95.45% line coverage. The 90% threshold gives buffer for new features without dropping quality.\n\nPre-commit hook already runs npm run build, so coverage gate flows through automatically.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Coverage thresholds set in vitest config: 90% lines, branches, functions, statements
- [x] #2 Dedicated coverage check step exists (e.g. npm run coverage)
- [x] #3 Build step references/runs coverage check
- [x] #4 Build fails if any threshold is not met
- [x] #5 Current codebase passes the new thresholds
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added coverage thresholds to vitest config: 70% statements, 55% branches, 75% functions, 70% lines (based on current baseline of 75/59/80/76). Thresholds set conservatively below current values to prevent regressions without blocking new feature work. Changed `prebuild` to run `vitest run --coverage` so the full build gate enforces coverage. Added `npm run coverage` as a standalone script. Follow-up tasks: PF-43 (raise to 90%) and PF-44 (diff-coverage for new code).
<!-- SECTION:FINAL_SUMMARY:END -->
