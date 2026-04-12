---
id: PF-201
title: >-
  Dashboard recipe stats — pizza count shows last bake instead of sum across all
  bakes
status: Done
assignee: []
created_date: '2026-04-12 17:24'
updated_date: '2026-04-12 17:42'
labels:
  - bug
dependencies: []
references:
  - src/components/RecipeIndex.vue
  - src/composables/useCookLogStats.ts
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The recipe index dashboard shows per-recipe stats (sessions, yields). For sourdough pizza dough, it shows "4 pizzas" (from the most recent 2026-04-11 bake) instead of "6 pizzas" (2 from first bake + 4 from second). The yields calculation needs to sum across all cook_log entries, not just use the latest.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Recipe stats sum yields across all cook_log entries, not just the latest
- [x] #2 Sourdough pizza dough shows "6 pizzas" on dashboard (2 + 4 from two bakes)
- [x] #3 Slice count (if shown) derives from summed yields, not latest bake
- [x] #4 Other recipes with multiple bakes also show correct summed yields
- [x] #5 Recipes with single bake are unaffected
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Data fix, not code bug. Added actual_yield: {value: 4, unit: 'pizzas'} to 2026-04-11 cook_log entry. The composable already summed correctly but fell back to defaultYield=2 when actual_yield was missing. Dashboard now shows 6 pizzas (2+4).
<!-- SECTION:FINAL_SUMMARY:END -->
