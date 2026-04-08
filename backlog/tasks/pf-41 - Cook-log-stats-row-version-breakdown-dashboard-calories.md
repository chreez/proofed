---
id: PF-41
title: Cook log stats row + version breakdown + dashboard calories
status: To Do
assignee: []
created_date: '2026-02-07 01:42'
updated_date: '2026-04-08 17:07'
labels:
  - feature
dependencies: []
priority: medium
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Recipe pages should show a dashboard-style aggregate stats row at the top of the Cook Log section — bake sessions, items, servings, calories, and version breakdown — mirroring the counting logic used in StatsPage. Also adds a "Calories Created" metric to the StatsPage hero tiles for dashboard-level visibility.

## Context

- `StatsPage.vue` already has counting logic for completed entries, `actual_yield.value` fallback, and items × `servingsPerItem` for servings. This task reuses that logic at recipe level.
- `CookLogSection.vue` currently renders date/version/summary/counts per entry but has no aggregate header stats.
- Calories derive from `recipe.nutrition.perServing.calories` × servings. When `nutrition` is absent, the per-recipe row shows `—`; dashboard aggregate silently skips recipes without nutrition.
- `servingsPerItem === 1` (e.g., simple-sourdough loaves) hides the servings slot — matches StatsPage behavior.
- Version breakdown comes from `cook_log[].version` (e.g., `v1.0.0 (2x), v1.1.0 (1x)`) and is hidden when only one version has bakes.

## Scope

1. Cook Log header stats row on recipe page (sessions / items / servings / calories / version breakdown)
2. Dashboard "Calories Created" tile in StatsPage hero
3. Shared counting helpers between CookLogSection and StatsPage (or verbatim logic mirror)

## Out of scope

- Per-entry structured stats block (see PF-177 epic — different scope)
- Calorie breakdown per version / per bake
- Charting or timeline of calories over time

## Visual gate

Layout for both the recipe-level row and the dashboard tile placement is chosen via the PF-41.1 demo subtask before any production code ships.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Cook Log section heading row renders a compact stats row showing bake sessions, items created, servings created, calories created, and version breakdown — positioned inline with or directly below the 'Cook Log' h3, before the entries list
- [ ] #2 Stats row only renders when cook_log has at least one entry where status !== 'in_progress'
- [ ] #3 Bake sessions count = number of completed cook_log entries (aberration entries included; in_progress excluded)
- [ ] #4 Items created = sum of actual_yield.value across completed entries, falling back to config.stats.defaultYield when actual_yield is absent
- [ ] #5 Servings created = items × config.stats.servingsPerItem; slot is hidden when servingsPerItem === 1 (matches StatsPage behavior)
- [ ] #6 Calories created = servings × nutrition.perServing.calories; renders '—' placeholder when recipe.nutrition is absent
- [ ] #7 Version breakdown shows per-version counts in format 'v1.0.0 (2x), v1.1.0 (1x)' derived from cook_log[].version; hidden when only one version has bakes
- [ ] #8 Counting logic mirrors StatsPage.vue exactly — same rules for completed filter, actual_yield fallback, and servingsPerItem multiplier (extracted to shared helper or copied verbatim)
- [ ] #9 Recipes with zero bakes remain unaffected — no stats row renders (CookLogSection stays conditional on cook_log length)
- [ ] #10 StatsPage hero tiles include a 'Calories Created' metric computed as the sum of (recipe servings across bakes) × nutrition.perServing.calories for every recipe that has a nutrition block
- [ ] #11 Recipes without a nutrition block contribute 0 to the dashboard calorie total (silently skipped; no placeholder in aggregate)
- [ ] #12 Visual direction for (a) Cook Log header stats row layout and (b) dashboard calories tile placement is chosen via PF-41.1 demo before any production code ships
- [ ] #13 npm run build passes
- [ ] #14 CookLogSection and StatsPage snapshot tests updated to cover the new stats row and hero tile
<!-- AC:END -->
