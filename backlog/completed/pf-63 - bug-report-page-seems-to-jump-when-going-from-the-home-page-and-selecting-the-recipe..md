---
id: PF-63
title: >-
  bug report - page seems to jump when going from the home page and selecting
  the recipe.
status: Done
assignee: []
created_date: '2026-02-07 11:18'
updated_date: '2026-02-07 11:34'
labels:
  - bug (styling)
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Horizontal content shift when navigating from home page to recipe page. Caused by scrollbar width changes and inconsistent header/container max-width classes between routes. Visible on both desktop and mobile.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No horizontal content shift when navigating between index and recipe pages
- [x] #2 Scrollbar-gutter stabilized so scrollbar appearance doesn't shift layout
- [x] #3 Header and main container use consistent max-width/padding across all routes
- [x] #4 Fix works on both desktop and mobile
- [x] #5 npm run build passes
<!-- AC:END -->
