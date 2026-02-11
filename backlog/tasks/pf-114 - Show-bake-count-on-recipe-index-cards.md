---
id: PF-114
title: Show bake count on recipe index cards
status: Done
assignee: []
created_date: '2026-02-11 04:53'
updated_date: '2026-02-11 04:58'
labels:
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a bake count label next to each recipe name on the index page, derived from cook_log length.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each recipe card on the index page shows the number of cook_log entries as a label (e.g. "3 bakes") on the same row as the recipe name
- [x] #2 Label uses a smaller font size and subdued color (stone palette) relative to the recipe name
- [x] #3 Label is hidden when cook_log is empty or absent (zero bakes = no label)
- [x] #4 Bake count is derived from cook_log.length in the fetched recipe JSON
<!-- AC:END -->
