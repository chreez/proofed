# PF-243 Spike Notes — centralize cook_log stats filter

**Status:** Findings drafted; awaiting user sign-off (per `.claude/rules/grooming.md` Spike Completion Requirements). Spike status remains `In Progress`.

**Date:** 2026-05-07
**Branch / worktree:** `worktree-agent-a1b7a42e749855a7b`

---

## 1. Background

DRAFT-71 grooming surfaced the smell: "is this stats stuff calculated in one place so we can't miss these cases?" Today every consumer reimplements its own filter. Ad-hoc filters drift: `useBakeAggregates.ts:182-190` already lets aberration entries flow into cadence + lifetime spend, even though `:194-209` excludes them from calories + group counts. PF-240 will add a third flag (`excludeFromStats`) plus a config-level default (`recipe.config.excludeFromStatsDefault`); without a single predicate, every new consumer becomes another opportunity for drift.

This spike inventories every consumer, documents flag handling, and recommends a centralized predicate.

---

## 2. Consumer inventory (AC #2, #3, #4)

| # | File:Line | Function / scope | What it computes | Respects `aberration` | Respects `status: 'in_progress'` | Respects `excludeFromStats` (future) | Notes |
|---|-----------|------------------|------------------|----------------------|----------------------------------|--------------------------------------|-------|
| 1 | `src/composables/useBakeAggregates.ts:178-184` | `computeBakeAggregates` — `allDates` (lifetime cadence) | Unique ISO dates with ≥1 completed entry | NO (aberrations counted) | YES (filters `status !== 'in_progress'`) | NO (not yet shipped) | Aberrations bake into `daysBaked`/`percent` |
| 2 | `src/composables/useBakeAggregates.ts:187-190` | `computeBakeAggregates` — `lifetimeSpend` | Σ `e.cost.total` across all completed entries | NO | YES | NO | Aberration spend silently rolls up |
| 3 | `src/composables/useBakeAggregates.ts:192-202` | `computeBakeAggregates` — `totalCalories` | Σ `servings × caloriesPerServing` | YES (`!e.aberration`) | YES | NO | Recipes w/o nutrition silently skipped |
| 4 | `src/composables/useBakeAggregates.ts:204-210` | `computeBakeAggregates` — `groupCounts` / `typeCounts` / `totalBakes` | Per-group bake counts; `totalBakes = Σ counts` | YES (`!e.aberration`) | YES | NO | Aberrations stripped both via group skip and per-entry filter |
| 5 | `src/composables/useBakeAggregates.ts:262-269` | `computeRecipeAggregates` — `recipeBakeCount` | Per-recipe completed non-aberration count | YES | YES | NO | Drives caption "Bake #N of …" |
| 6 | `src/components/StatsPage.vue:123-125` | `loadData` — `completedEntries` | Per-recipe filter before group/calendar bucketing | NO at this layer (split later) | YES | NO | Then split into `normalEntries` / `aberrationEntries` (`:132-133`) |
| 7 | `src/components/StatsPage.vue:132-149` | `loadData` — `normalEntries` → `bakeMap` | Calendar timeline (normal bakes only) | YES (`!e.aberration`) | YES (inherited) | NO | Aberration-only days routed via `aberrationDatesSet` (different render color) |
| 8 | `src/components/StatsPage.vue:174-189` | `loadData` — `aberrationEntries` | Aberration "recipes" rendered under Aberrations group | dedicated path | YES | NO | Forces calories=null per `:186` |
| 9 | `src/components/StatsPage.vue:335-346` | `allCalories` computed | Lifetime calories aggregate (mirrors AC #11) | YES (only `normalEntries` contribute) | YES (inherited) | NO | Recipes without `caloriesPerServing` silently skipped |
| 10 | `src/components/StatsPage.vue:420-431` | `aberrationDatesSet` computed | Calendar-only dim color set | dedicated aberration set | YES (inherited) | NO | Used by `calendarBakeCount` to OR with normal bake dates |
| 11 | `src/components/StatsPage.vue:436-452` | `calendarBakeCount` computed | "X bake sessions in last 12 months" headline | NO (counts both) | YES (inherited) | NO | Mirrors `useBakeAggregates` cadence semantics — DIVERGENT FROM #4 (`totalBakes`), see §3 |
| 12 | `src/composables/useCookLogStats.ts:19-22` | `completedBakes` | Filters `status !== 'in_progress'` | NO (kept as separate concern) | YES | NO | Exported helper used by CookLogSection header |
| 13 | `src/composables/useCookLogStats.ts:24-26` | `sessionCount` | `completedBakes(...).length` | NO | YES | NO | Drives per-recipe header "X sessions" |
| 14 | `src/composables/useCookLogStats.ts:28-38` | `itemsCreated` | Σ `actual_yield ?? defaultYield` | NO | YES | NO | Aberrations counted in items |
| 15 | `src/composables/useCookLogStats.ts:40-47` | `servingsCreated` | items × servingsPerItem | NO | YES | NO | Inherits `itemsCreated` |
| 16 | `src/composables/useCookLogStats.ts:53-60` | `caloriesCreated` | servings × `nutrition.perServing.calories` | NO | YES | NO | DIVERGENT vs StatsPage `allCalories` (#9) and useBakeAggregates `totalCalories` (#3): both upstream filters strip aberrations; this helper does NOT. CookLogSection (`src/components/CookLogSection.vue:41`) renders this in the per-recipe stats row, so a recipe with an aberration bake would see calories that would NOT show in the StatsPage rollup. See §3. |
| 17 | `src/components/CookLogSection.vue:36-41` | `completedCount`, `statsItems`, `statsServings`, `statsCalories` computed | Per-recipe header stats row (PF-41 A2) | NO (uses #12-16) | YES (inherited) | NO | Subject to drift cited in #16 |
| 18 | `src/composables/useCookLog.ts:23-26` | `latestCookLogEntryWithPhotos` | Newest entry with photos | YES (`!e.aberration`) | NO | NO | "in_progress" entries with photos can be selected — likely a bug separate from this spike |
| 19 | `src/composables/useCookLog.ts:47-52` | `latestCookLogEntryWithHero` | Hero banner photo source | YES | NO | NO | Same as #18 — `in_progress` not filtered |
| 20 | `src/components/RecipeIndex.vue:108-122` | `fetchRecipeMeta` — `bakeCount`, `hasCookLog` | Index card "X bakes" pill + baked/unbaked categorization | NO (counts every entry) | NO (counts in_progress entries) | NO | DIVERGENT: `bakeCount: cookLog.length` includes aberrations + in_progress; `hasCookLog` flips a recipe to "baked" the moment ANY cook_log row exists |
| 21 | `src/components/BakeDetailView.vue:97-101` | `shareRecipeBakeCount` computed | IG caption "Bake #N of …" | YES (`!e.aberration`) | YES | NO | Re-implements `computeRecipeAggregates` (#5) inline — drift hazard |
| 22 | `src/components/BakeLogPage.vue:41-63` | `fetchCookLogs` — flat list | Cook log feed across all recipes | NO (renders all entries) | NO (renders in_progress with status badge) | NO | Read-side render loop, not an aggregate. Out of scope for the predicate but flagged for completeness. |
| 23 | `src/components/ShareModal.vue:27-29` | `sortedEntries` | QR-share bake picker | NO | NO | NO | Also a render loop; user picks any entry. Out of scope. |
| 24 | `src/composables/useCost.ts:13-15` | `getMostRecentCost` | Latest entry with `cost.total != null` | NO | NO (rare in_progress entries usually lack cost) | NO | Drift candidate: if PF-240 marks an entry `excludeFromStats`, the print page's "most recent cost" snapshot should presumably skip it. Currently doesn't. |
| 25 | `src/composables/useCost.ts:34-42` | `getMostRecentCostWithItems` | Latest entry with `cost.items[]` populated | NO | NO | NO | Same as #24 |
| 26 | `src/composables/useCost.ts:53-61` | `getMostRecentCostWithItemsDate` | Date of #25 | NO | NO | NO | Same |
| 27 | `src/composables/useCost.ts:92-100` | `getMostRecentCostDate` | Date of #24 | NO | NO | NO | Same |
| 28 | `src/composables/useCost.ts:122-147` | `getVersionAverageCost` | Mean cost across current major version | NO | NO | NO | Aberration / in_progress / future excluded entries inflate the per-version average |
| 29 | `src/components/RecipePrintView.vue:201-216` | `costSources` computed | Print page cost source dropdown | NO | NO | NO | Lists every per-bake snapshot — aberrations show up as legitimate cost sources |
| 30 | `src/composables/useRecipeMeta.ts:113-128` | `image` computed (OG meta) | Bake-specific or recipe-level OG image | YES via `latestCookLogEntryWithHero` (#19) | NO | NO | Inherits #19's gaps |
| 31 | `src/composables/usePrintValidation.ts:96, 105, 112, 145, 203` | PV4 / PV6 / PV9 checks | Print readiness validators | NO | NO | NO | Validators, not aggregates — informational only. Pure schema checks. |
| 32 | `src/App.vue:271-280, 310-318` | `latestHeroPhoto`, `openHeroLightbox` | Hero banner | YES via #19 | NO | NO | Inherits #19 |
| 33 | `src/App.vue:320-334` | `aggregatedStepNotes` | Latest step note per state across all bakes | NO | NO (counts in_progress notes) | NO | Render-side: probably correct that in_progress notes show, but worth a note |
| 34 | `scripts/bake-stats.ts:209-215, 218-219, 221-222, 226-229, 231, 233, 256-279` | snapshot generator (skill) | `bake_count = log.length`, `aberrations`, `total_photos`, `cost`, etc. | NO (counts aberrations in `bake_count`); reports `aberrations` separately | NO (counts in_progress) | NO | DIVERGENT: aberrations roll into `bake_count`/`total_bakes` here, but NOT into `useBakeAggregates.totalBakes`. PF-240 AC #8 already mandates an update. |
| 35 | `scripts/bake-stats.ts:255-279` | snapshot — cost rollups | `recipeTotalSpent`, `bakesWithCost`, `totalCostSpent` | NO | NO | NO | Same drift as #34 |
| 36 | `scripts/bake-stats.ts:218-219, 308-320` | snapshot — `date_range`, global `dates` | First / last bake dates | NO | NO | NO | Includes aberrations in date range — matches `useBakeAggregates` cadence semantics |

**Grep verification:** `grep -rn "cook_log\|cookLog" src/ --include='*.ts' --include='*.vue'` returns the same surface area; no orphan readers found beyond test files (`*.spec.ts`) and demo pages (`DemoBakeLogPhotos.vue:29-31`, `DemoCostPicker.vue` — render-side only).

---

## 3. Divergence list with citations (AC #5)

The single point most surfaced in DRAFT-71/PF-240 grooming:

1. **Aberration in cadence vs calories vs group counts (`useBakeAggregates.ts:182-210`)**
   - `:184` adds aberration dates to `allDates` ⇒ `daysBaked` / `percent` count aberrations.
   - `:189` adds aberration `cost.total` to `lifetimeSpend`.
   - `:196-201` strips aberrations from `totalCalories`.
   - `:206-208` strips aberrations from `groupCounts` ⇒ `totalBakes`.
   *Result:* an aberration day will show as +1 in "X days baked", contribute its cost, but NOT increment "Bakes" or calories. By design today, but undocumented at the data layer.

2. **`useCookLogStats.caloriesCreated` vs `StatsPage.allCalories` vs `useBakeAggregates.totalCalories`**
   - `useCookLogStats.ts:53-60` (#16) does NOT filter aberrations — every completed entry contributes.
   - `StatsPage.vue:335-346` (#9) filters aberrations because `aberrationRecipes` get `caloriesPerServing: null`.
   - `useBakeAggregates.ts:196-201` (#3) filters aberrations explicitly via `!e.aberration`.
   *Result:* CookLogSection's per-recipe calories row (`CookLogSection.vue:41`) is computed from a different filter than StatsPage's lifetime aggregate. A recipe with one aberration will show non-zero calories in its header but contribute nothing to the dashboard total.

3. **`StatsPage.calendarBakeCount` (`StatsPage.vue:436-452`) vs `useBakeAggregates.totalBakes` (`:248`)**
   - `calendarBakeCount` counts unique dates from BOTH normal AND aberration bakes.
   - `totalBakes` is sum of group counts and explicitly excludes aberrations.
   *Result:* "Bake Sessions" hero tile (`StatsPage.vue:631`, `allBakes`) shows non-aberration session count; "X bake sessions in the last 12 months" caption (`:658`) shows aberration-inclusive count. Two different definitions of "session" on the same page.

4. **`RecipeIndex.fetchRecipeMeta` (`:108-122`) vs every other consumer**
   - `bakeCount: cookLog.length` includes aberrations AND `in_progress` entries.
   - Compare `useBakeAggregates.computeRecipeAggregates` (`:265-267`): `cookLog.filter(e => e.status !== 'in_progress' && !e.aberration).length`.
   *Result:* Index card "X bakes" pill disagrees with the IG caption "Bake #N of …" on the bake-detail page. The index pill is highest-friction visible mismatch.

5. **`BakeDetailView.shareRecipeBakeCount` (`:97-101`) re-implements `computeRecipeAggregates`**
   - Inline `cookLog.filter(e => e.status !== 'in_progress' && !e.aberration).length`.
   - `useBakeAggregates.ts:265-267` already exports the same logic.
   *Result:* harmless today (predicates match) but a future flag (`excludeFromStats`) added to one and not the other immediately drifts the IG caption from the dashboard.

6. **`useCookLog.latestCookLogEntryWithHero` / `…WithPhotos` (`:23-26, 47-52`) ignore `status: 'in_progress'`**
   - An in_progress bake with photos can become the hero photo source.
   - Inherits to OG meta (`useRecipeMeta.ts:113-128`) and App hero banner (`App.vue:271-280`).
   *Result:* Likely a low-frequency bug, but worth flagging for the "should the predicate apply here?" decision.

7. **`useCost.*` family (`useCost.ts:13-15, 34-42, 53-61, 92-100, 129-134`)** does not filter on any flag.
   - Aberration bakes can drive "most recent cost" on the print page.
   - Future `excludeFromStats` entries would still drive the headline cost.
   - `getVersionAverageCost` (`:122-147`) is the highest-impact: aberrations skew per-version averages.

8. **`scripts/bake-stats.ts` (`:209-279`)** counts aberrations in `bake_count` and `total_bakes` even though the schema reports `aberrations` separately. PF-240 AC #8 already mandates an update; centralization should be the implementation vehicle.

---

## 4. Recommended predicate (AC #6)

**Signature:**

```ts
// src/composables/useStatsFilter.ts (new)
import type { CookLogEntry, RecipeConfig } from '@/types/recipe'

/**
 * Single source of truth for "should this cook_log entry roll up into stats?"
 *
 * Rules (in evaluation order — early-returns false on first hit):
 *   1. status === 'in_progress'           → false  (always; not a completed bake)
 *   2. e.excludeFromStats === true        → false  (PF-240 explicit opt-out)
 *   3. recipeConfig?.excludeFromStatsDefault === true
 *      AND e.excludeFromStats !== false   → false  (recipe defaults all bakes
 *                                                    out unless entry overrides)
 *   4. otherwise                          → true
 *
 * Aberration is intentionally NOT consulted here. Per DRAFT-71 / PF-240, the
 * two flags are independent: aberration controls calories + group + hero
 * inclusion, excludeFromStats controls cadence + spend + counts. Callers that
 * need both filters compose them: `isCountedInStats(e, cfg) && !e.aberration`.
 */
export function isCountedInStats(
  entry: CookLogEntry,
  recipeConfig?: RecipeConfig | null
): boolean {
  if (entry.status === 'in_progress') return false
  if (entry.excludeFromStats === true) return false
  if (
    recipeConfig?.excludeFromStatsDefault === true &&
    entry.excludeFromStats !== false
  ) return false
  return true
}

/** Convenience: entries currently passing isCountedInStats. */
export function filterCountable(
  entries: CookLogEntry[] | undefined,
  recipeConfig?: RecipeConfig | null
): CookLogEntry[] {
  if (!entries?.length) return []
  return entries.filter(e => isCountedInStats(e, recipeConfig))
}

/**
 * Stricter predicate for surfaces that ALSO exclude aberrations
 * (calories, group counts, recipeBakeCount). Composed for clarity at call
 * sites — kept separate so the policy is auditable in one place.
 */
export function isCountedInPrimaryStats(
  entry: CookLogEntry,
  recipeConfig?: RecipeConfig | null
): boolean {
  return isCountedInStats(entry, recipeConfig) && !entry.aberration
}
```

**Why three exports, not one:**
- `isCountedInStats` is the one new consumers reach for; safe default.
- `filterCountable` is ergonomic for `Array#filter` chains in `useBakeAggregates`/StatsPage.
- `isCountedInPrimaryStats` codifies the "non-aberration AND counted" composition that 4-5 call sites need today (`useBakeAggregates.ts:196, 206, 266`, `BakeDetailView.vue:99-100`, future `RecipeIndex` fix).

---

## 5. Recommended location (AC #7)

**Choice:** `src/composables/useStatsFilter.ts` as **pure functions** (no `ref`/`computed` wrapper).

**Rationale:**
- Existing precedent: `src/composables/useCookLogStats.ts` is also pure-functions-only (no reactivity), and is co-located in `composables/` because it operates on `Recipe`/`CookLogEntry`. New helper sits alongside it for discoverability.
- Pure funcs are trivially callable from `scripts/bake-stats.ts` — non-Vue context. (A `useStatsFilter()` reactive wrapper would not work in Node.)
- Single file keeps the predicate visible in one open editor tab; reviewer can audit policy in <50 LOC.
- Rejected alternatives:
  - `src/utils/statsFilter.ts` — fine, but breaks convention (`useCookLogStats` already lives in `composables/`); no other pure stats utils exist under `src/utils/`.
  - Method on a Recipe class — repo uses plain JSON + interfaces, no Recipe class exists. Out of project style.

---

## 6. Edge case treatment (AC #8)

| Edge case | Treatment | Citation |
|-----------|-----------|----------|
| `entry.status === 'in_progress'` | Always excluded from stats (rule 1). Today filtered ad-hoc in `useBakeAggregates.ts:180`, `StatsPage.vue:124`, `useCookLogStats.ts:21`; missing in `RecipeIndex.vue:122` (drift). Centralizing fixes the index card. | AC #8 explicit |
| `recipe.config.excludeFromStatsDefault === true` | Read-time application (rule 3). PF-240 task description says "interacts at write-time (cook_log entry creation)"; spike disagrees: write-time only handles the default for new entries. Read-time still needs to honor the config because data may have been loaded before the flag existed (back-compat). Entry can override per-bake via `excludeFromStats: false`. | PF-240 AC #2, AC #9 |
| `entry.excludeFromStats === false` (explicit opt-IN despite recipe default) | Honored (rule 3 only triggers when entry value is not strictly `false`). | PF-240 AC #1 |
| Hero photo selection (`useCookLog.ts:47-52`) | Predicate does NOT apply directly. Hero photo concerns "most recent good photo," not stats inclusion. Open question: should `latestCookLogEntryWithHero` filter `in_progress`? Recommendation: yes (likely a bug). Should it filter `excludeFromStats`? Recommendation: NO — an excluded bake with a beautiful hero photo is still the recipe's hero. Aberration filter stays on the hero helper as a separate concern. | §3.6 |
| Print-page cost sources (`RecipePrintView.vue:201-216`) | Predicate does NOT apply directly. Per-bake cost snapshots are a render-side dropdown, not an aggregate. User explicitly picks a source. | Out of stats scope |
| Cost helpers (`useCost.ts`) | OPEN QUESTION for follow-up draft. Recommendation: `getVersionAverageCost` should filter `isCountedInStats` (averaging includes excluded aberrations today). `getMostRecentCost*` should NOT filter — they are "the most recent costed bake" by definition. Document in the follow-up draft. | §3.7 |
| `BakeLogPage.vue` and `ShareModal.vue` | Predicate does NOT apply. These are render-side bake feeds where the user expects to see every bake (including in_progress + aberration). | §3 row #22, #23 |
| `App.vue:aggregatedStepNotes` (`:320-334`) | Predicate does NOT apply. Step notes from in_progress and aberration bakes are still useful; this is teaching context, not stats. | §3 row #33 |
| `usePrintValidation.ts` | Predicate does NOT apply. Schema validators run on raw data, not stats. | §3 row #31 |

---

## 7. Aberration vs excludeFromStats decision (AC #9)

**Decision:** Keep aberration as a **separate concern**; do NOT merge it into `isCountedInStats`.

**Rationale:**
1. **PF-240 AC #3 explicit:** "flags are independent." DRAFT-71 grooming reached the same conclusion.
2. **Different semantics today (already shipped):**
   - Aberration → calories OFF, group counts OFF, hero photo OFF; cadence ON, spend ON.
   - excludeFromStats (proposed) → ALL stats surfaces OFF.
   - Hero photo selection cares about aberration, not stats inclusion.
3. **Composition is explicit:** call sites that need both write `isCountedInStats(e, cfg) && !e.aberration` (or use `isCountedInPrimaryStats`). The composition is auditable; merging would lock a specific policy and lose the aberration-only consumers (hero photo, calendar coloring).
4. **PF-240 already enumerates per-surface behavior** (AC #4-7): the work is identifying which surface needs which composition. The predicate library makes that mechanical.

**Mandatory follow-up:** the existing aberration filter in `useBakeAggregates.ts:196, 206, 266` should be expressed as `isCountedInPrimaryStats(e, recipe.config)` in the refactor. New surfaces that "want both" use the same call. New surfaces that only want stats-inclusion (no aberration filter) call `isCountedInStats`.

---

## 8. Recommended call site changes (informational — for follow-up drafts)

| Site | Today | Proposed |
|------|-------|----------|
| `useBakeAggregates.ts:180` | `cookLog.filter(e => e.status !== 'in_progress')` | `filterCountable(cookLog, recipe.config)` |
| `useBakeAggregates.ts:184` (cadence dates) | iterates all `completed` | iterate over `filterCountable(cookLog, recipe.config)` directly (PF-240 #4) |
| `useBakeAggregates.ts:189` (lifetimeSpend) | iterates all `completed` | iterate over `filterCountable(...)` (PF-240 #5) |
| `useBakeAggregates.ts:196` (calories normal) | `completed.filter(e => !e.aberration)` | `cookLog.filter(e => isCountedInPrimaryStats(e, recipe.config))` |
| `useBakeAggregates.ts:206` (group counts) | same | same |
| `useBakeAggregates.ts:265-267` (`recipeBakeCount`) | inline | `cookLog.filter(e => isCountedInPrimaryStats(e, recipe.config)).length` |
| `BakeDetailView.vue:99-100` | inline | reuse `computeRecipeAggregates(currentRecipe.value).recipeBakeCount` (eliminates duplicate logic) |
| `StatsPage.vue:124` | `cookLog.filter(e => e.status !== 'in_progress')` | `filterCountable(cookLog, recipe.config)` |
| `useCookLogStats.ts:19-22` (`completedBakes`) | `e.status !== 'in_progress'` | `isCountedInStats(e, recipe.config)` — note: helper currently does not take `recipe` so signature must add it (breaking, but only 4-5 call sites in `CookLogSection.vue`) |
| `RecipeIndex.vue:122` (`bakeCount: cookLog.length`) | every entry | `filterCountable(cookLog, recipe.config).length` (matches dashboard semantic) — open call: do we additionally exclude aberrations from the index pill? Recommend yes for visual coherence, document in the draft |
| `scripts/bake-stats.ts:209, 214` (`bake_count`, `total_bakes`) | `log.length` | `filterCountable(log, recipe.config).length` |
| `useCost.ts:122-147` (`getVersionAverageCost`) | every cost entry | `recipe.cook_log.filter(isCountedInStats).filter(major matches)` |

Hero / OG / cost-source / cook-log-feed surfaces (rows #18-19, #22-30 in §2) intentionally remain on their existing single-purpose filters.

---

## 9. Test coverage expectations (informational)

A future test file `src/composables/useStatsFilter.spec.ts` should cover the truth table:

| `status` | `aberration` | `excludeFromStats` | `excludeFromStatsDefault` | `isCountedInStats` | `isCountedInPrimaryStats` |
|----------|--------------|--------------------|---------------------------|--------------------|----------------------------|
| `'in_progress'` | * | * | * | false | false |
| `'complete'` | false | undefined | undefined | true | true |
| `'complete'` | true | undefined | undefined | true | false |
| `'complete'` | false | true | * | false | false |
| `'complete'` | false | undefined | true | false | false |
| `'complete'` | false | false | true | true | true |
| `'complete'` | true | true | * | false | false |

Plus integration tests on `useBakeAggregates.spec.ts` mirroring PF-240 AC #11-14.

---

## 10. Out of scope for this spike

- Implementation. Centralization happens in follow-up drafts.
- Refactor of `useCost.ts` to honor stats flags — opens a separate conversation about per-bake-cost semantics. Tracked as a draft.
- Scratchpad-side write-time defaults (PF-240 AC #9). Predicate is read-time only.
- Whether `aberration` should also gain a config-level default (`aberrationDefault`). Out of scope.

---

## 11. Follow-up drafts created

All drafts reference PF-243 spike notes as source.

| Draft ID | Title | Inherits |
|----------|-------|----------|
| DRAFT-69 | Land `src/composables/useStatsFilter.ts` (centralized predicate) | §4, §5 — precursor for all others |
| DRAFT-67 | Refactor `useBakeAggregates` to use centralized stats filter | §3.1, §8 |
| DRAFT-68 | Refactor `bake-stats` skill to use centralized stats filter | §3.8, table rows #34-36 |
| DRAFT-70 | Refactor RecipeIndex `bakeCount` to match stats predicate | §3.4, table row #20 |
| DRAFT-71 | Refactor `BakeDetailView.shareRecipeBakeCount` to reuse `computeRecipeAggregates` | §3.5, table row #21 |
| DRAFT-72 | Reconcile `useCookLogStats` vs `StatsPage` calories filter | §3.2, table rows #16-17 vs #9, #3 |
| DRAFT-73 | Apply stats predicate to `useCost.getVersionAverageCost` | §3.7, table row #28 |

Implementation order: DRAFT-69 first (foundation), then DRAFT-67 + DRAFT-68 in parallel (highest-impact consumers), then the surface-specific drafts (DRAFT-70-73) in any order.

---

## 12. Sign-off requirement

Per `.claude/rules/grooming.md` ("Spike Completion Requirements"), this spike cannot be marked Done until:

1. ☑ Research notes exist (this file)
2. ☑ Architecture decision documented (§4-§7)
3. ☑ ≥1 draft per actionable finding (§11)
4. ☐ User has reviewed findings — **PENDING**

Spike status remains **In Progress** until step 4.
