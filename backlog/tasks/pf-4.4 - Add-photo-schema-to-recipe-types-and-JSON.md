---
id: PF-4.4
title: Add photo schema to recipe types and JSON
status: To Do
assignee: []
created_date: '2026-02-07 04:36'
labels:
  - implement
dependencies:
  - PF-4.2
parent_task_id: PF-4
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update CookLogEntry TypeScript interface with photos array. Add PhotoReference type (src, alt, caption). Update .gitignore with photos-source/ and HEIC patterns. Follows schema from PF-4.2 design.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CookLogEntry interface updated with optional photos field
- [ ] #2 PhotoReference interface added (src: string, alt: string, caption?: string)
- [ ] #3 .gitignore updated with photos-source/, *.HEIC, *.heic entries
- [ ] #4 Existing tests still pass with updated types
- [ ] #5 npm run build passes
<!-- AC:END -->
