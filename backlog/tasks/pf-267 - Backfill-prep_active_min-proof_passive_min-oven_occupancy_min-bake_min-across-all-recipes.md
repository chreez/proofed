---
id: PF-267
title: >-
  Backfill prep_active_min / proof_passive_min / oven_occupancy_min / bake_min
  across all recipes
status: To Do
assignee: []
created_date: '2026-05-12 13:11'
updated_date: '2026-05-14 20:25'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255.3 spike. Write scripts/backfill-recipe-timing.ts that mirrors the spike classification heuristic (preheat → oven_occupancy; timer:true outside bake → passive_proof; bake stage → oven_occupancy; default → active). Run against all 26 recipes in public/recipes/. Hand-audit the ambiguous cases flagged in pf-255.3-spike-notes.md §6 before commit (ny-pizza COLD_BULK_FERMENT / COLD_PROOF timer mismatch; stretch-fold timer covers rest + ~5 min action; PREP_WORKSPACE 'Preheat & Gather' title false-positive). Adds four optional fields to meta in each recipe. Required before scheduler MVP can read structured timing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Add 4 optional fields (prep_active_min, proof_passive_min, oven_occupancy_min, bake_min) to RecipeMeta interface in src/types/recipe.ts
- [ ] #2 Write scripts/backfill-recipe-timing.ts implementing the classification heuristic (preheat first → oven_occupancy_min only; bake/roast or in bake stage → bake_min + oven_occupancy_min; timer:true → proof_passive_min; default → prep_active_min)
- [ ] #3 Script is idempotent — re-running on already-backfilled recipes is a no-op
- [ ] #4 Script uses id.includes('preheat') as the strict preheat predicate to avoid PREP_WORKSPACE 'Preheat & Gather' false-positive
- [ ] #5 All 27 recipes in public/recipes/ have the 4 fields populated in meta
- [ ] #6 Each touched recipe has a patch version bump + change_log entry with PF-237 ingredient snapshot
- [ ] #7 scripts/sync-ingredient-snapshots.ts runs idempotent (no diff) after backfill
- [ ] #8 Heuristic + classification edge cases documented in script header comment
- [ ] #9 Ambiguous cases (cool folding into proof_passive, candida preheat-roast null duration, stretch-fold composite) noted in task notes
- [ ] #10 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Heuristic (in order — first match wins)

1. **PREHEAT** — `state.id.includes('preheat')` (id-only, strict). Counts toward `oven_occupancy_min` only.
   - Strict id-only check avoids the `PREP_WORKSPACE 'Preheat & Gather'` false-positive flagged in PF-255.3 spike §6. Title contains "Preheat" but the state's primary action is gathering tools; id `PREP_WORKSPACE` correctly excludes it.
2. **BAKE/ROAST** — state id or title includes `bake` or `roast`, OR parent stage id/title matches `/bake/i`. Counts toward `bake_min` + `oven_occupancy_min`.
3. **PASSIVE** — `timer === true` and not preheat/bake. Counts toward `proof_passive_min`.
4. **ACTIVE** — default fallthrough (timer:false, not preheat/bake). Counts toward `prep_active_min`.

States with `duration_min` null/undefined contribute 0 to all buckets.

## Aggregate stats across the 27-recipe corpus

- Avg prep_active_min:    59.9 min
- Avg proof_passive_min:  1068.7 min (≈ 17.8 hr — skewed by ichiran & ferment-heavy doughs)
- Avg oven_occupancy_min: 59.1 min
- Avg bake_min:           41.5 min
- Max proof: 8037 min (ichiran-ramen — multi-day broth simmer + age sauce/noodles + marinate eggs)
- Max bake:  163 min (gochujang-garlic-buns — includes a 120-min confit-garlic-bake)
- Max prep:  301 min (tomita-tsukemen — complex 4-day broth/tare/noodle build with many short active steps)

## Ambiguous cases (handled, flagged)

- **Cool states folded into `proof_passive_min`.** 16 `timer:true` cool states (cool-on-rack, cool in pan, etc.) contribute to passive_proof since the baker is free and the oven is also free. PF-255.3 spike §3 treated `passive_cool_min` as a separate column but explicitly recommended NOT adding it to the schema. The scheduler can re-derive cool from a state walk if needed. Documented in script header.
- **`candida-focaccia:preheat-roast`** (`duration_min: null`, `timer:false`). Title "Preheat Oven for Garlic" + id starts with `preheat-`. Classified as preheat → contributes 0 (null duration). Correct behavior; PF-261 D4 audit also flagged this state for a future data fix (add duration + flip timer:true).
- **Stretch-fold composite states** (`stretch-fold-2/3/4` in jalapeño-cheddar with `timer:true`, 30 min each; `STRETCH_FOLD_SETS` in sourdough-pizza-dough with `timer:false`, 90 min). The current heuristic respects the existing `timer` flag — composite-passive states fold into `proof_passive_min`, composite-active states fold into `prep_active_min`. ~5 min of active work per fold inflates `proof_passive_min` slightly. PF-261 D4 audit recommended splitting these into separate `FOLD_N` + `REST_N` states; that refactor would automatically correct the numbers without changing this heuristic.
- **`PREP_WORKSPACE 'Preheat & Gather'`** (sourdough-cheddar-bay-biscuits). Title contains "Preheat" but `id = PREP_WORKSPACE`. Strict id-only preheat predicate correctly classifies it as `prep_active_min` (5 min, timer:false). Resolved the spike-flagged false positive.
- **No-oven recipes correctly produce `oven_occupancy_min = 0`**: ba-bolognese, coco-curry, ichiran-ramen, lime-chantilly, ny-pizza-sauce, thai-tea-boba, tomita-tsukemen. Scheduler should treat oven=0 as "doesn't compete for the oven slot."

## Schema diff (src/types/recipe.ts:RecipeMeta)

Added 4 optional numeric fields after `total_time`:
- `prep_active_min?: number`
- `proof_passive_min?: number`
- `oven_occupancy_min?: number`
- `bake_min?: number`

All are additive and optional — `meta.total_time: string` remains the canonical human-facing label. Existing UI is unaffected.

## Files touched

- `src/types/recipe.ts` — schema addition
- `scripts/backfill-recipe-timing.ts` — new, idempotent backfill script
- 27 × `public/recipes/*.json` — 4 meta fields added + patch version bump + change_log entry + PF-237 ingredient snapshot

## Future scheduler implications

- `bake_min == oven_occupancy_min` only when there's no preheat — useful sanity check.
- For sequential multi-batch (loaves, baking-steel pizza), the scheduler multiplies `bake_min × ceil(defaultYield / itemsPerBatch)` and adds preheat once.
- `proof_passive_min == 0` for some quick recipes (sourdough-cheddar-bay-biscuits = 0). Scheduler should not assume every recipe has passive time.
- High-prep / low-oven recipes (tomita-tsukemen 301m prep / 0 oven) are stovetop-heavy — they compete for stove burners + baker attention, not the oven. Future schema may want a `stove_busy_min` field; out of scope here.
<!-- SECTION:NOTES:END -->
