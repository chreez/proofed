---
id: PF-262
title: Compute nutrition blocks for 6 un-nutritioned recipes
status: To Do
assignee: []
created_date: '2026-05-12 13:11'
updated_date: '2026-05-14 19:51'
labels:
  - nutrition
  - backfill
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spawned from PF-255.6 spike audit.

Compute and write nutrition block on 6 recipes currently missing it:
- candida-focaccia
- grain-free-bread
- potato-buns
- sourdough-discard-cheese-crackers
- sourdough-pizza-dough
- tartine-rugelach

All 6 already have full stages[].gather.ingredients[] with gram amounts → USDA FDC lookups should be straightforward. No new data needed.

This is also a known D16 / F17-F22 validation requirement (checklist).

Why needed: PF-255 pricing UI wants per-serving cost vs per-serving calorie comparison.

Audit detail: backlog/tasks/pf-255.6-spike-notes.md section 2C.

Priority: Medium.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each of the 6 target recipes has a non-null nutrition block (D16 / F17-F22 satisfied)
- [ ] #2 nutrition.totals and nutrition.perServing populated; perServing = totals / servings within +/-0.1
- [ ] #3 nutrition.dataSource records 'USDA FoodData Central' (or specific proxy where used)
- [ ] #4 nutrition.breakdown[] enumerates every ingredient with non-zero calories; sum(breakdown.calories) matches totals.calories within +/-1
- [ ] #5 Each recipe version bumped (minor) with a change_log[] entry summarizing 'Add nutrition data.' and a frozen ingredients[] snapshot per PF-237 (F34)
- [ ] #6 scripts/sync-ingredient-snapshots.ts is idempotent on the modified set (no further diffs after run)
- [ ] #7 npm run build passes (BV1-BV3)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed 2026-05-12.

## Results

| Recipe | totals.kcal | perServing.kcal | servings | version |
|---|---|---|---|---|
| candida-focaccia | 2023.5 | 224.8 | 9 | v1.1.0 → v1.2.0 |
| grain-free-bread | 1702.8 | 141.9 | 12 | v1.1.0 → v1.2.0 |
| potato-buns | 2623.5 | 327.9 | 8 | v1.0.0 → v1.1.0 |
| sourdough-discard-cheese-crackers | 1731.9 | 17.3 | 100 | v1.0.0 → v1.1.0 |
| sourdough-pizza-dough | 3863.5 | 241.5 | 16 | v1.3.1 → v1.4.0 |
| tartine-rugelach | 5621.4 | 351.3 | 16 | already done (PF-253) |

## Notes

- Tartine-rugelach already had nutrition (shipped under PF-253). Verified the existing block is structurally sound; left untouched.
- Sourdough-discard-cheese-crackers has no `config.stats` block — fell back to parsing `meta.yields`. Used the high-end "100 crackers" with a "1 cracker" serving label. **Flag for DRAFT-84** to add `config.stats` (group: Crackers, defaultYield: 100, servingsPerItem: 1, servingUnit: crackers).
- Bread flour 100g → 364 cal (used existing `bread_flour` mapping; appears in pizza dough).
- All breakdown sums match totals within ±1 cal (F35 satisfied).

## Sources

- USDA FoodData Central (SR Legacy + Foundation) for: almonds (170567), coconut flour (2345997), psyllium (label), xanthan gum (label), cream of tartar (170173), apple cider vinegar (173469), russet potato (170026), rosemary (169270), smoked paprika (170924), garlic powder (171325), black pepper (170929), cheddar (173414), parmesan (173417), ghee (171413), whole milk (171265).
- Derived: sourdough starter / discard = 50% AP flour + 50% water (matches existing `starter` mapping).
- Label data proxies: psyllium, xanthan gum, baking soda (sodium-only), diastatic malt (King Arthur).

## Ambiguous ingredients / assumptions

- `russet_potato` — recipe specifies "Russet Potato (1 medium, ~200g raw)" with total=120g. Treated 120g as cooked/mashed weight at raw nutrition density (small impact: 79 cal/100g).
- `eggs` in grain-free-bread / candida-focaccia / potato-buns — all use grams directly (200g, 168g, 68g), no "whole" unit conversion needed.
- `discard` / `sourdough_starter` — modeled as 50/50 flour+water (182 cal/100g). Real fermented starter has slightly lower carbs from yeast metabolism but USDA has no direct entry; the derived proxy was already established in the codebase.

## Recipes blocked on missing stats (for DRAFT-84)

- **sourdough-discard-cheese-crackers**: needs `config.stats` block. Current servingSize="1 cracker" / servings=100 was inferred from yields; DRAFT-84 should formalize this with explicit defaults (~90 crackers midpoint perhaps).

## Files

- scripts/usda-mappings.ts (added ~28 new mappings; kebab + snake aliases where needed)
- scripts/calculate-nutrition.ts (added resolveServings preferring config.stats over yields; parseServings now strips trailing parens)
- public/recipes/candida-focaccia.json (nutrition + v1.2.0)
- public/recipes/grain-free-bread.json (nutrition + v1.2.0)
- public/recipes/potato-buns.json (nutrition + v1.1.0)
- public/recipes/sourdough-discard-cheese-crackers.json (nutrition + v1.1.0)
- public/recipes/sourdough-pizza-dough.json (nutrition + v1.4.0)

Build: npm run build → exit 0 (2475 tests passing, vue-tsc clean, vite build clean).
<!-- SECTION:NOTES:END -->
