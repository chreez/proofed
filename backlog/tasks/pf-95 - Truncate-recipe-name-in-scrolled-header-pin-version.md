---
id: PF-95
title: 'Truncate recipe name in scrolled header, pin version'
status: To Do
assignee: []
created_date: '2026-02-10 03:10'
updated_date: '2026-02-10 03:13'
labels:
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The scrolled (compact) header shows the recipe name + version. On narrow screens or long recipe names, the version can get clipped. The name should truncate with ellipsis while the version number stays pinned and always visible.

Example: "Carrot Cake wi... v1.0"
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scrolled header recipe name truncates with ellipsis independently of the version
- [ ] #2 Version number (e.g. v1.0) is always visible and never clipped, regardless of screen width
- [ ] #3 If no version present, name truncates normally (default behavior, no special handling)
- [ ] #4 Single line — no additional vertical space compared to current header
- [ ] #5 Works on iPhone SE width (320px) through desktop
- [ ] #6 HITL visual sign-off before commit
<!-- AC:END -->
