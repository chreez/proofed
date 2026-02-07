---
id: PF-14
title: Nutritional info
status: Done
assignee: []
created_date: '2026-02-06 18:47'
updated_date: '2026-02-07 00:23'
labels:
  - feature
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add FDA-style nutritional info to each recipe page. Data sourced from USDA FoodData Central API at build time, stored in recipe JSON. All values are estimates — must be clearly labeled as such.\n\nPlacement TBD — agent must present 2-3 interactive mockups (collapsed badge, modal/drawer, accordion) for user to choose from before implementing. This is a styling task — requires human visual sign-off (PF-22 rule).\n\nAlways shows on recipe page — displays 'Not yet calculated' placeholder if data is missing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nutrition data fetched from USDA FoodData Central API at build time
- [ ] #2 Full FDA-style fields: calories, fat, saturated fat, carbs, fiber, sugar, protein, cholesterol, sodium
- [ ] #3 Values clearly labeled as estimates
- [ ] #4 Displays 'Not yet calculated' placeholder when nutrition data missing
- [ ] #5 Per-serving and total available
- [ ] #6 Calculation breakdown visible (which ingredient contributes what)
- [ ] #7 Placement decided via visual mockups — user must choose before implementation
- [ ] #8 Human visual sign-off on dev server before commit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented estimated nutritional info for recipe pages using USDA FoodData Central data. Includes:\n- Types: NutrientTotals, IngredientNutrition, RecipeNutrition added to recipe.ts\n- CLI script: scripts/calculate-nutrition.ts with USDA mappings for 13 ingredients (npm run nutrition)\n- ATK cinnamon buns: 856 kcal/bun calculated and written to recipe JSON\n- NutritionSection.vue: per-serving/full toggle, nutrient table, collapsible ingredient breakdown, USDA source footer\n- TOC integration: Nutrition entry in desktop sidebar and mobile bottom sheet\n- Placement: variant B (after stages, before Cook Log) — user approved\n- Styling: matched open section style of Cook Log and Version History (no card wrapper)\n- 9 component tests passing\n- Checklist entries F17-F22 added
<!-- SECTION:FINAL_SUMMARY:END -->
