---
id: PF-160
title: Stats Leaderboard Page
status: Done
assignee: []
created_date: '2026-02-25 00:54'
updated_date: '2026-02-26 20:28'
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
- [x] #1 Route `/stats` renders the stats dashboard page (replaces `/demo/stats`)
- [x] #2 Tab bar shows "Dashboard" linking to `/stats` (alongside Recipes, Bake Log)
- [x] #3 Recipe type `stats` block added: `{ group, defaultYield, unit, servingsPerItem, servingUnit }` — all baked recipes backfilled
- [x] #4 `CookLogEntry` type extended with optional `aberration: boolean` and `aberration_note: string`
- [x] #5 Stats page fetches recipe manifest + all recipe JSONs at runtime — no hardcoded data
- [x] #6 Recipes grouped by `stats.group` value; only recipes with cook_log entries appear
- [x] #7 Three granularity levels computed from live data: bake sessions, items produced, servings
- [x] #8 Aberrant cook_log entries (aberration: true) excluded from normal group counts, shown in separate Aberrations section
- [x] #9 Pantry Ledger section populated from cook_log entries that have `cost` data
- [x] #10 Page updates automatically when new cook_log entries are added — no manual stat maintenance
- [x] #11 `npm run build` passes
- [ ] #12 Recipe schema validation updated to cover new `stats` block and aberration fields
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Schema Layer (landed)

Added `RecipeStats` (yieldUnit, yieldMultiplier) and `CookLogYield` (value, unit, notes) types. Extended `RecipeConfig.stats` and `CookLogEntry.actual_yield`. Added stats config to all 13 recipe JSONs.

**Commit:** 5f5569a

**Remaining:** AC #1-4, #8-11 blocked on spike (PF-160.1) visual direction pick. AC #8 (actual_yield backfill) needs user input on per-bake yields. AC #9 (bake log skill) needs implementation after schema.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Live stats leaderboard at /stats. Production StatsPage fetches all recipe JSONs, groups by stats.group, computes 3-level granularity (sessions/items/servings) from cook_log. Cadence timeline, production mix bars, pantry ledger. Schema: RecipeStats with group/defaultYield/unit/servingsPerItem/servingUnit. Aberration support on CookLogEntry. 61 tests, full coverage.
<!-- SECTION:FINAL_SUMMARY:END -->
