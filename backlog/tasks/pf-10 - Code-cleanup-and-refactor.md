---
id: PF-10
title: Code cleanup and refactor
status: To Do
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-07 00:29'
labels:
  - refactor
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Full codebase cleanup pass:\n\n1. Remove unused mockup files from public/mockups/ (partially done by TOC work)\n2. Dead code audit: find unused imports, components, composables\n3. UnoCSS consolidation: identify duplicate utility patterns, promote to shortcuts\n4. File organization: ensure everything follows project structure conventions\n\nThis is a refactor — no feature changes. Build must pass before and after.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All unused mockup files removed from public/mockups/
- [ ] #2 No unused imports across src/
- [ ] #3 No unused components or composables
- [ ] #4 UnoCSS shortcuts reviewed — duplicated utility patterns promoted
- [ ] #5 npm run build passes
- [ ] #6 No visual regressions (snapshot tests pass)
<!-- AC:END -->
