# PF-261 D4 Audit Notes

**Date:** 2026-05-12
**Rule:** D4 — `timer: true` ONLY on passive states (rise, bake, cool, ferment, proof, retard, chill, autolyse, rest). Active/hands-on states must have `timer: false`.

## Methodology

1. Walked every recipe in `public/recipes/*.json`, iterating `stages[].states[]` and inspecting each state's `timer`, `duration_min`, `title`, `id`, `direction`, and `exit_condition`.
2. Applied a keyword heuristic:
   - **Passive markers**: `ferment`, `proof`, `retard`, `autolyse`, `rest`, `rise`, `chill`, `cool`, `bake`, `bulk`, `soak`, `marinate`, `cure`, `temper`, `preheat`.
   - **Active markers**: `mix`, `knead`, `fold`, `stretch`, `shape`, `scale`, `divide`, `roll`, `cut`, `glaze`, `whisk continuously`, `stir constantly`, `assemble`, etc.
3. Reviewed every flagged state by hand against its `direction`. Where the *baker is free* during the bulk of the duration, classified as passive (timer=true). Where the *baker is at the stove / counter actively manipulating*, classified as active (timer=false).
4. Cross-referenced existing convention: 35+ states already have `timer: true` with durations 60–4320 min (overnight bulks, cold retards, simmers, marinates, ages). The pizza recipes were the outliers.

## Recipe totals

- Recipes audited: **27** (excluding `index.json`, `cost-rates.json`)
- States walked: **507**
- States with `timer: true` before fixes: **171**
- States with `timer: true` after fixes: **177**

## Violation table

All listed cases reviewed by hand. Only definite violations were flipped; ambiguous cases left in place and flagged below.

| Recipe | Stage | State ID | Title | Current | Fixed To | Reasoning |
|---|---|---|---|---|---|---|
| ny-style-pizza | BULK_FERMENT | COLD_BULK_FERMENT | Cold Bulk Ferment | false | **true** | 720 min in fridge, dough unattended. Pure passive. Matches all other recipes' overnight bulks (e.g. `simple-sourdough:OVERNIGHT_BULK` = timer true, 600 min). Confirmed by PF-255.3 spike §6. |
| ny-style-pizza | DIVIDE_PROOF | COLD_PROOF | Cold Proof | false | **true** | 2880 min (48 hr) cold proof in fridge. Pure passive. Spike-flagged. |
| sourdough-pizza-dough | BULK_FERMENT | BULK_REST | Bulk Rest | false | **true** | 90 min "let the dough rest undisturbed at room temperature." Baker is free. Matches `bulk-rest`/`bulk-ferment` convention (timer=true, 90-180 min) elsewhere. |
| sourdough-pizza-dough | BULK_FERMENT | COLD_BULK_FERMENT | Cold Bulk Ferment | false | **true** | 720 min cold ferment. Same as ny-style-pizza. |
| sourdough-pizza-dough | DIVIDE_PROOF | COLD_PROOF | Cold Proof | false | **true** | 2880 min cold proof. Same as ny-style-pizza. |
| ~~sourdough-pizza-dough~~ | ~~STRETCH_FOLD~~ | ~~STRETCH_FOLD_SETS~~ | ~~Stretch & Fold Sets~~ | ~~false~~ | ~~**true**~~ | **REVERTED.** Composite state covering 3 active folds + 30-min interval rests. Initially flipped to timer=true (dominant duration is passive), but the validation test (`tests/validation/recipe-schema.spec.ts`) rejected because "Stretch & Fold Sets" matches no passive pattern (no `rest`/`ferment`/`proof` in title). Other sourdough recipes (`simple-sourdough`, `simple-sourdough-wheat`, `birote-salado`, `sourdough-cheddar-cheese`) split folds and rests into separate states; pizza-dough's composite design is the outlier. Conservative: leave timer=false. Flagged for human review — recommend splitting into `STRETCH_FOLD_1` (active, 1 min) + `REST_1` (passive, 30 min) × 3. |
| jalapeno-cheddar-sourdough | AUTOLYSE | temper-butter | Temper Butter | false | **true** | 25 min "place on counter... comes to room temperature naturally." Pure passive — exact analog of `lime-chantilly:rest-cc` (timer=true, 25 min). |

**Total violations fixed:** 6 states across 3 recipes (1 candidate, `STRETCH_FOLD_SETS`, reverted after test pushback). Direction: all passive-without-timer (false → true). No active-with-timer violations found in the corpus.

## Heuristic false positives (reviewed, left alone)

These flagged on keyword but are correctly classified already:

- **All `PREP_WORKSPACE` / `PREHEAT` states with `timer: true`**: passive oven warm-up, baker monitors timer. Convention is consistent (16 of 17 preheat states have timer=true; the one exception is `candida-focaccia:preheat-roast` which has `duration_min: null` — see ambiguous list below).
- **`*/FOLD_*`, `*/COIL_FOLD_*`, `*/INTO_BASKET`**: 1–3 min hands-on placement/fold steps. Correctly `timer: false`.
- **`ba-bolognese:brown-beef` / `reduce-wine` / `boil-pasta`**: active stove monitoring with "stirring occasionally," "smashing down," "cook until al dente." Active. `timer: false` correct.
- **`carrot-cake:BROWN_BUTTER_COOK`, `coco-curry:FRY_ONIONS`/`SEAR_PORK`/`SEASON_SIMMER`/`REHEAT_CURRY`**: stove-side hands-on (swirling, stirring frequently, monitoring). Active.
- **`tartine-lemon-cream-tart:setup-water-bath`/`cook-curd`/`cool-curd`**: setup is active; cook-curd is "whisk continuously"; cool-curd is "stirring from time to time" + cutting butter. All active.
- **`thai-tea-boba:BOIL_WATER`/`HEAT_SYRUP`/`BOIL_FOR_BOBA`**: stove-side, "stirring constantly" / monitoring boil. Active.
- **`tomita-tsukemen:TOAST_FISH`/`COOK_NOODLES`**: stove-side, monitored. Active.
- **`sourdough-chocolate-chip-cookies:brown-butter`**: "whisking frequently and scraping the bottom." Active.
- **`carrot-cake:COOL_BROWN_BUTTER` / `CHOP_PECANS` / `COOL_SPICED_OIL` / `CUBE_BUTTER`**: `duration_min: null` — these chain into the next step without an explicit wait window. Cool steps are passive in spirit but have no duration to time. Left as `timer: false` to avoid creating phantom timers.
- **`tartine-rugelach:freeze-shaped` (timer=true, 12 min)**: 10–15 min freezer chill. Passive. Heuristic flagged it only because the word "shaped" appeared in title — false positive. `timer: true` is correct.
- **`jalapeno-cheddar-sourdough:stretch-fold-2/3/4` (timer=true, 30 min each)**: composite fold+rest like `STRETCH_FOLD_SETS`. ~25 min passive of the 30 min window. `timer: true` correct.
- **`lime-chantilly:chill-bowl` / `rest-cc` (timer=true)**: passive chills. Correct.
- **`potato-buns:cool` (timer=true, 15 min)**: brush + cool. Most of the 15 min is passive rack cooling. Correct.
- **`sourdough-cinnamon-buns:BULK_FERMENT` (timer=true, 90 min)**: bulk ferment with periodic folds — overall passive. Correct.
- **`ny-style-pizza:COOL_SLICE` / `sourdough-pizza-dough:COOL_SLICE` (timer=false, 3 min)**: 2–3 min rest + cut + serve. Duration is dominated by the active cutting/serving. Conservative: leave `timer: false`.
- **`pre-shape-rectangle` (jalapeno-cheddar, dur=25, timer=false)**: combined active shaping + 15–20 min rest + roll. Active dominates. Leave alone.

## Ambiguous — left for human review

| Recipe | State | Notes |
|---|---|---|
| candida-focaccia | preheat-roast | `duration_min: null`, `timer: false`. Other preheat states have timer=true with a duration. This one is procedurally a passive oven warm-up but has no duration set so the timer field is moot. Recommend a follow-up to add `duration_min: 10–15` AND flip timer to true, but flagged for human review since this is data, not just a flag flip. |
| sourdough-cheddar-bay-biscuits | PREP_WORKSPACE | `duration_min: 5`, `timer: false`. Title "Preheat & Gather" — mixes active gather with passive preheat. Spike PF-255.3 §6 already flagged this as a heuristic edge case ("primary action is gathering tools"). Leave timer=false (active dominates), but consider splitting into two states. |
| sourdough-pizza-dough | STRETCH_FOLD_SETS | See table above. Composite state with 90-min duration is predominantly passive but contains active fold sub-steps. Validation test couldn't accept timer=true with current title. Recommend splitting into 3× `FOLD_N` (1 min, timer=false) + 3× `REST_N` (29 min, timer=true) pairs. |

## Version bumps applied

| Recipe | Before | After | Change-log entry |
|---|---|---|---|
| ny-style-pizza | v1.4.0 | v1.4.1 | "D4 fix: flip COLD_BULK_FERMENT and COLD_PROOF to timer:true (passive cold rests, baker is free; matches corpus-wide convention)." |
| sourdough-pizza-dough | v1.3.0 | v1.3.1 | "D4 fix: flip BULK_REST, COLD_BULK_FERMENT, COLD_PROOF to timer:true (passive rests; baker is free). STRETCH_FOLD_SETS candidate reverted — composite state, flagged for human review." |
| jalapeno-cheddar-sourdough | v2.1.0 | v2.1.1 | "D4 fix: flip temper-butter to timer:true (25-min passive butter warm-up, baker is free)." |

All change_log entries include a cloned `ingredients` snapshot frozen from the current `stages[].gather.ingredients` per PF-237.
