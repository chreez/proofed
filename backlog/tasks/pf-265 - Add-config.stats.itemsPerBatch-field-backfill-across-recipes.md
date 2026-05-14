---
id: PF-265
title: Add config.stats.itemsPerBatch field + backfill across recipes
status: To Do
assignee: []
created_date: '2026-05-12 13:11'
updated_date: '2026-05-14 20:09'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255.3 spike §5. The throughput scheduler needs to model oven-slot occupancy: batches_needed = ceil(defaultYield / itemsPerBatch). Examples: cinnamon buns 8/skillet → 1 batch; cookies 24 total, 8/sheet → 3 batches; sourdough loaves 2 total, 1/dutch oven → 2 batches. Add optional itemsPerBatch?: number to RecipeStats interface in src/types/recipe.ts:183. Backfill all recipes that already have a stats block. Recipes without itemsPerBatch should be treated by the scheduler as 'assume 1 batch'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 config.stats.itemsPerBatch added as optional numeric field on RecipeStats interface in src/types/recipe.ts with JSDoc explaining default semantics (absent → assume one bake)
- [ ] #2 Field is purely additive: existing recipes without itemsPerBatch continue to type-check and validate
- [ ] #3 Backfilled on recipes whose defaultYield clearly spans multiple oven loads: sourdough-chocolate-chip-cookies (6/sheet), sourdough-discard-cheese-crackers (45/sheet), simple-sourdough (1/dutch oven), simple-sourdough-wheat (1/dutch oven), sourdough-cheddar-cheese (1/dutch oven), jalapeno-cheddar-sourdough (1/dutch oven), birote-salado (3/dutch oven), ny-style-pizza (1/steel), sourdough-pizza-dough (1/steel)
- [ ] #4 Single-bake recipes (rugelach, gochujang buns, both cinnamon bun variants, potato buns, biscuits, focaccia, baguettes loaded together, cake, grain-free bread, all sauces/soups) intentionally left without itemsPerBatch — defaults to one bake
- [ ] #5 tartine-lemon-cream-tart flagged as ambiguous (recipe says 'bake as many as needed and freeze remaining discs') — not backfilled; documented in task notes
- [ ] #6 Each backfilled recipe gets a patch version bump + change_log entry referencing PF-265
- [ ] #7 PF-237 ingredient snapshots preserved: ran scripts/sync-ingredient-snapshots.ts and confirmed no orphan change_log entries
- [ ] #8 npm run build passes (vitest + vue-tsc + vite build)
<!-- AC:END -->

## Implementation Notes

### Schema change
- `src/types/recipe.ts:RecipeStats` — added `itemsPerBatch?: number` with JSDoc explaining default semantics (absent → assume one bake).

### Backfilled (9 recipes, all patch bumps)
| Recipe | Old → New | itemsPerBatch | Rationale |
|---|---|---:|---|
| sourdough-chocolate-chip-cookies | v2.0.1 → v2.0.2 | 6 | Recipe explicitly says "No more than 6 cookies per sheet" + "Bake one sheet at a time". 23 cookies / 6 = 4 batches. |
| sourdough-discard-cheese-crackers | v1.1.1 → v1.1.2 | 45 | meta.yields says "2 sheet pans" for 90 crackers → 45/sheet. |
| simple-sourdough | v3.6.0 → v3.6.1 | 1 | One dutch oven, one loaf at a time. |
| simple-sourdough-wheat | v1.1.0 → v1.1.1 | 1 | One dutch oven, one loaf at a time. |
| sourdough-cheddar-cheese | v1.1.0 → v1.1.1 | 1 | One dutch oven, one loaf at a time. |
| jalapeno-cheddar-sourdough | v2.1.2 → v2.1.3 | 1 | One dutch oven, one loaf at a time. |
| birote-salado | v1.2.0 → v1.2.1 | 3 | Recipe says "Load 2-3 rolls into the dutch oven"; 5 / 3 = 2 batches. |
| ny-style-pizza | v1.5.0 → v1.5.1 | 1 | One baking steel, one pizza; recipe says "Repeat for the second pizza". |
| sourdough-pizza-dough | v1.4.0 → v1.4.1 | 1 | One baking steel, one pizza at a time. |

### Intentionally NOT backfilled (single-bake defaults)
- `atk-cinnamon-buns-ultimate`, `sourdough-cinnamon-buns` — 8 buns / one skillet.
- `gochujang-garlic-buns`, `potato-buns` — fit in one pan.
- `tartine-rugelach` — 16 rugelach fit on one sheet.
- `sourdough-cheddar-bay-biscuits` — 10 biscuits fit on one sheet.
- `tartine-baguette` — 2-3 baguettes load on the baking stone together.
- `carrot-cake` — both 23cm pans bake together (rotated halfway).
- `candida-focaccia`, `grain-free-bread` — single pan / single loaf.
- Sauces/soups/non-baked items (`ba-bolognese`, `coco-curry`, `ny-pizza-sauce`, `lime-chantilly`, `ichiran-ramen`, `tomita-tsukemen`, `thai-tea-boba`) — no oven slot at all.

### Flagged ambiguous
- **`tartine-lemon-cream-tart`** — yields 12 tartlets in 10cm pans, but the recipe instruction says "bake as many as needed and freeze remaining discs". Usage pattern is "make as many as fit your tartlet pans, freeze the rest" rather than "always bake 12". Did NOT backfill — defaultYield=12 + missing itemsPerBatch = scheduler will treat as "all in one batch", which is wrong but the right answer depends on the user's tartlet-pan inventory (likely 4-6 standard pans). Defer until scheduler design surfaces a need; consider per-bake `actual_yield` driving throughput instead.

### Build
- `npx tsx scripts/sync-ingredient-snapshots.ts` → 0/27 recipes changed (snapshots already in sync — the backfill script wrote ingredient snapshots inline on each new change_log entry).
- `npm run build` → exit 0 (tests + vue-tsc + bundle).
