---
id: PF-80
title: Construct NY-Style Pizza Dough recipe page (Jacob Burton / Stella Culinary)
status: Done
assignee: []
created_date: '2026-02-08 19:51'
updated_date: '2026-02-08 20:05'
labels:
  - recipe
dependencies: []
references:
  - ny-style-pizza-recipe_P_yJO1pwpKI/
  - 'https://www.youtube.com/watch?v=P_yJO1pwpKI'
  - >-
    https://stellaculinary.com/recipes/baking-pastry/baking/bread/new-york-style-pizza-dough
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the recipe JSON and add to the index for Jacob Burton's NY-Style Pizza Dough from Stella Culinary. Source video and transcript already captured in `ny-style-pizza-recipe_P_yJO1pwpKI/`. Original web recipe recovered from Wayback Machine (site now redirects to chefjacob.com).

**Key source data (from archived recipe):**
- 370g bread flour, 230g water (62%), 5g instant yeast, 14g olive oil, 6g salt, 15g sugar
- Baker's percentages provided
- Yield: 2x 310g portions, 12" pizzas
- Stages: autolyse → knead → bulk ferment → divide/proof → shape → bake
- Bake at 550°F (288°C) on pizza stone, 8–12 min
- Optional cold retard overnight at either ferment stage

**References:**
- Source material: `ny-style-pizza-recipe_P_yJO1pwpKI/` (video, transcript, 62 screenshots)
- YouTube: https://www.youtube.com/watch?v=P_yJO1pwpKI
- Original recipe (archived, site now dead): https://stellaculinary.com/recipes/baking-pastry/baking/bread/new-york-style-pizza-dough
- Channel: Jacob Burton / Stella Culinary
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `public/recipes/ny-style-pizza.json` exists, follows recipe schema in `src/types/recipe.ts`
- [ ] #2 All ingredients in grams only; baker's percentages included in ingredient notes
- [ ] #3 Stages cover full pipeline: autolyse → knead → bulk ferment → divide & proof → stretch → top → bake
- [ ] #4 `timer: true` only on passive states (autolyse, bulk ferment, proof, bake)
- [ ] #5 Every state has non-empty `exit_condition`
- [ ] #6 Cold retard (overnight fridge option) documented in `next_time` or stage notes — not a separate variant
- [ ] #7 Default toppings: pepperoni + low-moisture mozzarella on raw San Marzano sauce
- [ ] #8 `meta.source` references Jacob Burton / Stella Culinary with YouTube URL; `source.type: "adapted"`
- [ ] #9 Recipe added to `public/recipes/index.json`
- [ ] #10 Source material directory moved from repo root to `photos-source/ny-style-pizza/source/`
- [ ] #11 Nutrition block present (spike subtask PF-80.1 if research needed)
- [ ] #12 `/validate` passes — all D-checks, S-checks, BV-checks green
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Created `public/recipes/ny-style-pizza.json` — NY-Style Pizza Dough adapted from Jacob Burton / Stella Culinary.

**Stats:** 10 ingredients, 7 stages, 17 states, 5 vessels, nutrition calculated via USDA pipeline.

**Per pizza (1 of 2):** 1574 kcal, 75.4g protein, 69.4g fat, 157.6g carbs, 3461mg sodium

**Key decisions:**
- Yields "2 pizzas" (2 × 310g dough portions + toppings)
- Default toppings: pepperoni (70g) + low-moisture mozzarella (140g) on raw San Marzano sauce (70g) per pizza
- Cold retard documented in notes on BULK_FERMENT_REST and PROOF_PORTIONS states (not separate variant)
- Source material moved to `photos-source/ny-style-pizza/source/`
- 6 new USDA mappings added (olive_oil, instant_yeast, cornmeal, mozzarella, pepperoni, san_marzano_sauce)
- All 444 tests passing, validation clean, build green
<!-- SECTION:FINAL_SUMMARY:END -->
