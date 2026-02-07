---
id: PF-8
title: Build coverage gate
status: To Do
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-07 00:24'
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
- [ ] #1 Coverage thresholds set in vitest config: 90% lines, branches, functions, statements
- [ ] #2 Dedicated coverage check step exists (e.g. npm run coverage)
- [ ] #3 Build step references/runs coverage check
- [ ] #4 Build fails if any threshold is not met
- [ ] #5 Current codebase passes the new thresholds
<!-- AC:END -->
