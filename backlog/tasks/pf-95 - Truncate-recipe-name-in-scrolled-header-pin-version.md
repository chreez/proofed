---
id: PF-95
title: 'Truncate recipe name in scrolled header, pin version'
status: Done
assignee: []
created_date: '2026-02-10 03:10'
updated_date: '2026-02-10 09:46'
labels:
  - ux
dependencies: []
priority: low
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The scrolled (compact) header shows the recipe name + version. On narrow screens or long recipe names, the version can get clipped. The name should truncate with ellipsis while the version number stays pinned and always visible.

Example: "Carrot Cake wi... v1.0"
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scrolled header recipe name truncates with ellipsis independently of the version
- [x] #2 Version number (e.g. v1.0) is always visible and never clipped, regardless of screen width
- [x] #3 If no version present, name truncates normally (default behavior, no special handling)
- [x] #4 Single line — no additional vertical space compared to current header
- [x] #5 Works on iPhone SE width (320px) through desktop
- [x] #6 HITL visual sign-off before commit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Split scrolled header recipe name and version into separate elements. Name truncates with ellipsis via `truncate` class, version pinned with `flex-shrink-0`. Works from iPhone SE (320px) through desktop.\n\nFiles changed:\n- `src/App.vue` — split single span into two sibling spans in scrolled header template
<!-- SECTION:FINAL_SUMMARY:END -->
