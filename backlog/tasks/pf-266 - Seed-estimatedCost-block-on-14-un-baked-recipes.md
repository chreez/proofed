---
id: PF-266
title: Seed estimatedCost block on 14 un-baked recipes
status: In Progress
assignee: []
created_date: '2026-05-12 13:11'
updated_date: '2026-05-14 20:17'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spawned from PF-255.6 spike audit.

Populate Recipe.estimatedCost (EstimatedCost interface, src/types/recipe.ts) for 14 recipes that have no cook_log entries and therefore no per-bake cost data:
- candida-focaccia
- carrot-cake
- coco-curry
- grain-free-bread
- ichiran-ramen
- ny-pizza-sauce
- potato-buns
- sourdough-cheddar-bay-biscuits
- sourdough-chocolate-chip-cookies
- sourdough-discard-cheese-crackers
- tartine-baguette
- tartine-rugelach
- thai-tea-boba
- tomita-tsukemen

estimatedCost is recipe-level (not per-bake) → uses /cost skill against current ingredients with default servings.

Why needed: PF-255 pricing UI should be able to show 'estimated cost to bake' for recipes that have never been made.

Open question for grooming: confirm with orchestrator whether PF-255 pricing should consume estimatedCost for un-baked recipes, or require at least one bake (i.e., is estimatedCost the right surface?).

Audit detail: backlog/tasks/pf-255.6-spike-notes.md section 2E + open question 3.

Priority: Low — defer until pricing UI is being built.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Re-audit at start (2026-05-12): 13 of the 14 originally-listed un-baked recipes ALREADY have estimatedCost (seeded during the cost-rates work prior to 2026-04-23). The PF-255.6 spike audit did not inspect the existing estimatedCost field — only checked cook_log[].cost. As a result the original scope is mostly stale.

## Actual gap (current state)
| Recipe | cook_log | cost data | estimatedCost | Action |
|---|---|---|---|---|
| 13 of 14 original candidates | 0 bakes | — | ✅ already present | SKIP |
| lime-chantilly | 1 bake (2026-05-13) | cost: null | ❌ missing | SEED |
| ba-bolognese | 1 bake | cost.items[16] populated | ❌ missing | SKIP (has real cost data — use cook_log) |
| jalapeno-cheddar-sourdough | 4 bakes | all with cost.items | ❌ missing | SKIP |
| tartine-lemon-cream-tart | 2 bakes | both with cost.items | ❌ missing | SKIP |
| tartine-rugelach | 1 bake | cost.items[12] | ❌ missing | SKIP |

Per task rules: 'Don't overwrite existing data — if a recipe has cook_log entries with cost.items, skip it (use real data, not estimated).'

## Schema location chosen
Reused existing 'Recipe.estimatedCost: EstimatedCost' field already declared in src/types/recipe.ts (line 65) — no new type needed. Shape: { total, perServing, servings, items: CookLogCostItem[], estimatedAt }. This mirrors PF-262 cook_log cost convention and is already consumed by RecipePrintView.vue + usePrintValidation.ts. Convention: sourceType='rate', sourceName=full product description from cost-rates.json (e.g. 'H-E-B Cream Cheese 8 oz ($2.30)') — matches every other seeded estimatedCost in the codebase.

## Recipes seeded (1)
- **lime-chantilly** v1.0.1 → v1.0.2 (patch bump per PF-265 pattern). 8 ingredients priced via cost-rates.json:
  - Total: $3.12 / batch
  - Per serving: $0.28 across 11 rosettes
  - lime_zest used a derived proxy rate ($0.33/g) since no exact rate exists — $0.33 ea fresh lime × ~1g zest per fruit; documented inline in sourceName.

## Recipes skipped (4, have real cost data)
ba-bolognese, jalapeno-cheddar-sourdough, tartine-lemon-cream-tart, tartine-rugelach — all have cook_log[].cost.items[] populated. Pricing UI should consume cook_log; estimatedCost is not the right surface for these.

## Verification
- npx tsx scripts/sync-ingredient-snapshots.ts → 0/27 recipes changed (idempotent ✅)
- npm run build → exit 0 (tests + vue-tsc + bundle + prerender 27 recipe + 50 bake pages)

## Unusual notes
1. The spike audit (PF-255.6) generated this draft based on an incomplete read — flagged for the orchestrator. The audit's open question 3 ('is estimatedCost the right surface?') is implicitly answered YES by the existing data: every un-baked recipe already has it. Future audits should grep for the field directly.
2. lime_zest is not in cost-rates.json. Used a derived rate ($0.33/g — ~1g zest per fresh lime at $0.33 ea). Mirrors how orange_zest is priced ($0.125/g — ~6g zest per orange at $0.75). Could be added to cost-rates.json in a follow-up if needed.
3. Staged, not committed (per instructions).
<!-- SECTION:NOTES:END -->
