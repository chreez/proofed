---
id: PF-278
title: Calculate nutrition data for Tartine Walnut Currant Sourdough
status: To Do
assignee: []
created_date: '2026-05-27 21:34'
labels:
  - nutrition
  - sourdough
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for `public/recipes/tartine-walnut-currant-sourdough.json`. Follow the pattern from `tartine-country-rye.json` and `simple-sourdough.json`.

## Acceptance Criteria

- `nutrition` block in tartine-walnut-currant-sourdough.json has non-null `totals` and `perServing`
- `servings` matches parsed yields (20 servings total: 2 loaves × 10 slices each)
- `sum(breakdown.calories)` equals `totals.calories` ±1
- `perServing` equals `totals / servings` ±0.1
- All ingredients with >0 calories listed in `breakdown` with `fdcId` for traceability
- `dataSource` field populated (e.g., "USDA FoodData Central")
- `calculatedDate` set to date of calculation
- D16, F17-F22 checks pass

## Ingredient list (post-bake yield: ~1800g across 2 loaves; 20 slices)

- 800g KABF (FDC ~168896)
- 100g BSM Marquis whole wheat (FDC ~168893 whole wheat flour)
- 100g BSM Ryman Rye (FDC ~169747 whole rye flour)
- 770g water (incl. ~120g currant soak liquid; negligible nutrition contribution from currant solids in water)
- 200g starter (50/50 AP+WW @ 100% hydration = 50g AP + 50g WW + 100g water)
- 20g fine sea salt (FDC ~173468)
- 230g walnuts (FDC ~170187)
- 130g Sun-Maid Zante currants (FDC ~169949 or current equivalent)
- 25g walnut oil (FDC ~172339)

## Notes

- Walnuts and walnut oil contribute meaningful calories and fat — don't under-count.
- Currants add carbs + fiber + natural sugar.
- Use FDC SR Legacy entries where available for stability.
<!-- SECTION:DESCRIPTION:END -->
