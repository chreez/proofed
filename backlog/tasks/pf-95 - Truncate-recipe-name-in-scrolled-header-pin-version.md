---
id: PF-95
title: 'Truncate recipe name in scrolled header, pin version'
status: To Do
assignee: []
created_date: '2026-02-10 03:10'
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
- [ ] #1 Scrolled header shows recipe name with ellipsis truncation when space is tight
- [ ] #2 Version number (e.g. v1.0) always visible, never truncated
- [ ] #3 Single line, no additional vertical space compared to current
- [ ] #4 Works on mobile widths (iPhone SE minimum)
<!-- AC:END -->
