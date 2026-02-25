---
id: PF-160
title: Stats Leaderboard Page
status: To Do
assignee: []
created_date: '2026-02-25 00:54'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New `/stats` route showing a tree-view breakdown of entire baking history. Three layers of granularity: bake sessions → items produced → servings/slices. Smart grouping by product type (sourdough breads, pizza, buns). Aberrations like focaccia pivots get their own distinct category. Per-entry `actual_yield` field on cook_log entries. Stats config per recipe for fun units + multipliers. Malleable system that adapts as recipes and bakes accumulate.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 New route `/stats` renders a stats leaderboard page
- [ ] #2 Tree-view groups recipes by product type (not flat categoryMap)
- [ ] #3 Three granularity levels: bake sessions → items produced → servings/slices
- [ ] #4 Aberrant bakes (e.g. focaccia pivot) categorized distinctly, not counted as original recipe yield
- [ ] #5 Per-recipe stats config defines unit names and multipliers (e.g. 'slices', 8/pizza)
- [ ] #6 nutrition.servings used as fallback when no stats config override exists
- [ ] #7 cook_log entries support optional `actual_yield` field for deviation tracking
- [ ] #8 Existing cook_log entries backfilled with actual_yield where it differs from recipe default
- [ ] #9 Bake log skill updated to prompt for yield confirmation when entry is created
- [ ] #10 Page adapts naturally as new bake logs are added — no manual stat updates needed
- [ ] #11 npm run build passes
<!-- AC:END -->
