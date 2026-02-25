---
id: PF-160
title: Stats Leaderboard Page
status: To Do
assignee: []
created_date: '2026-02-25 00:54'
updated_date: '2026-02-25 04:49'
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
- [ ] #1 Route `/stats` renders the stats dashboard page (replaces `/demo/stats`)
- [ ] #2 Tab bar shows "Dashboard" linking to `/stats` (alongside Recipes, Bake Log)
- [ ] #3 Recipe type `stats` block added: `{ group, defaultYield, unit, servingsPerItem, servingUnit }` — all baked recipes backfilled
- [ ] #4 `CookLogEntry` type extended with optional `aberration: boolean` and `aberration_note: string`
- [ ] #5 Stats page fetches recipe manifest + all recipe JSONs at runtime — no hardcoded data
- [ ] #6 Recipes grouped by `stats.group` value; only recipes with cook_log entries appear
- [ ] #7 Three granularity levels computed from live data: bake sessions, items produced, servings
- [ ] #8 Aberrant cook_log entries (aberration: true) excluded from normal group counts, shown in separate Aberrations section
- [ ] #9 Pantry Ledger section populated from cook_log entries that have `cost` data
- [ ] #10 Page updates automatically when new cook_log entries are added — no manual stat maintenance
- [ ] #11 `npm run build` passes
- [ ] #12 Recipe schema validation updated to cover new `stats` block and aberration fields
<!-- AC:END -->
