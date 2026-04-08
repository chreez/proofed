---
id: PF-41
title: Cook log stats row + version breakdown + dashboard calories
status: In Progress
assignee: []
created_date: '2026-02-07 01:42'
updated_date: '2026-04-08 17:55'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
### 2026-04-08 — Demo review + decision lock

User reviewed PF-41.2 demo page and locked the following decisions:

- **A2 (without version chips)** — CookLogSection header: 4 stacked mini-tiles (sessions, items/unit, [servings], calories). Servings tile hidden when `servingsPerItem === 1`. Calories show `—` when no nutrition.
- **B3** — StatsPage dashboard: keep existing 4-tile hero row, add a second-row wide accent tile below for "Calories Created across all bakes".
- **Version breakdown REJECTED**: user said "i don't like that as a feature actually". AC #7 is effectively void — no `versionBreakdown` helper will ship. The feature is removed from scope even though AC #7 still exists (task kept in In Progress until the user approves the visual HITL; ACs will be rewritten/struck on Done).

### 2026-04-08 — Production implementation complete (awaiting HITL)

Files changed:
- `src/composables/useCookLogStats.ts` (NEW) — shared counting helpers: `completedBakes`, `sessionCount`, `itemsCreated`, `servingsCreated`, `caloriesCreated`. Mirrors StatsPage counting logic exactly. No `versionBreakdown`.
- `src/composables/useCookLogStats.spec.ts` (NEW) — 20 unit tests (all helpers + branches + edge cases).
- `src/components/CookLogSection.vue` — added optional `recipe?: Recipe` prop (backward compat — existing tests that only pass `cookLog` still render the plain header), computed `showStatsRow` + `completedCount` + `statsItems` + `statsServings` + `statsCalories`, `formatCalories` helper, A2 mini-tile template block between the header div and entry list, scoped styles (`.cook-log-stats`, `.cook-log-stats-tile`, `.cook-log-stats-value`, `.cook-log-stats-label`).
- `src/components/CookLogSection.stats.spec.ts` (NEW) — 9 tests for the new header stats row. Written as a separate file to avoid touching `CookLogSection.spec.ts` which is stashed for PF-179.
- `src/components/StatsPage.vue` — `caloriesPerServing: number | null` on `StatsRecipe` interface, captured from `recipe.nutrition?.perServing?.calories ?? null` in `loadData` (aberration recipes get `null`), `allCalories` computed (silently skips recipes with null), `formatCaloriesK` helper (M / k / plain integer), B3 accent tile template (`.ds3-calories`) shown when `allCalories > 0`, responsive CSS breakpoints at 600px and 400px.
- `src/components/StatsPage.spec.ts` — 6 new tests appended for B3 accent tile rendering, silent-skip aggregation, M/k/plain formatting, `actual_yield` usage.
- `src/App.vue` — wires `:recipe="currentRecipe"` prop on `<CookLogSection>`. Removed `DemoCookLogStats` import + `v-else-if="route.name === 'cook-log-stats-demo'"` template block.
- `src/components/__snapshots__/CookLogSection.spec.ts.snap` — updated (1 entry, 2 lines added for `<!-- A2 -->` comment + `<!--v-if-->` placeholder in the baseline spec case where no recipe prop is passed). NON-OVERLAPPING with PF-179's stashed snapshot changes — different regions of the same snapshot entry.
- `src/components/DemoCookLogStats.vue` — DELETED (disposable PF-41.2 spike).

Build status: `npm run build` passes. 1281 tests across 48 files. Type-check clean. Bundle builds. Diff coverage: 100% lines, 96% branches, 100% functions on PF-41 changed files.

AC mapping (post-rejection):
- AC #1 A2 stats row in header — DONE (A2 layout, no version chips per decision)
- AC #2 Hidden when no completed entries — DONE (`showStatsRow` gate)
- AC #3 Session count — DONE
- AC #4 Items with actual_yield fallback — DONE
- AC #5 Servings with servingsPerItem === 1 hide — DONE
- AC #6 Calories with `—` fallback — DONE
- AC #7 Version breakdown — **REJECTED by user, will not ship**
- AC #8 Counting logic mirrors StatsPage — DONE (shared helper extracted)
- AC #9 Zero bakes unaffected — DONE (`completedCount > 0` gate)
- AC #10 Dashboard calories tile — DONE (B3 accent tile)
- AC #11 Silent skip for recipes without nutrition — DONE
- AC #12 Visual gate via PF-41.2 demo — DONE (demo reviewed, decision locked)
- AC #13 `npm run build` passes — DONE
- AC #14 Snapshot tests updated — DONE

Review URLs (dev server on port 6811):
- http://192.168.1.210:6811/recipe/simple-sourdough#cook-log-section (A2 tiles in context, 13 bakes, nutrition present)
- http://192.168.1.210:6811/stats (B3 accent tile below hero row)
- http://192.168.1.210:6811/demo/stats (same layout via demo route)

Status: **In Progress, awaiting visual HITL sign-off** before commit.
<!-- SECTION:NOTES:END -->
