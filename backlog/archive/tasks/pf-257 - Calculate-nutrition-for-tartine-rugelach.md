---
id: PF-257
title: Calculate nutrition for tartine-rugelach
status: Draft
assignee: []
created_date: '2026-05-13 21:20'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Recipe `tartine-rugelach` ships without a nutrition block (PV3, F16 fail; print page renders "not yet generated"). Calculate USDA-sourced nutrition totals/per-serving/breakdown using the existing `scripts/calculate-nutrition.ts` pipeline.

## Context
- Recipe yields: 16 rugelach
- Ingredients: cream cheese, unsalted butter, AP flour, einkorn flour, salt, walnuts, brown sugar, cinnamon, currants, melted butter, egg, sugar topping
- All ingredient IDs already mapped in `stages[].gather.ingredients[]`

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AC1: `nutrition` block populated with `servings: 16`, `servingSize: "1 rugelach (~XXg)"`, `calculatedDate`, `dataSource: "USDA FoodData Central"`
- [ ] #2 AC2: `nutrition.totals` has non-null `calories`, `protein`, `totalFat`, `saturatedFat`, `carbohydrates`, `sugar`, `fiber`, `sodium`
- [ ] #3 AC3: `nutrition.perServing` = totals / 16, all 8 fields populated (±0.1 tolerance)
- [ ] #4 AC4: `nutrition.breakdown[]` lists every ingredient with calories > 0 (F22) — each entry has `ingredientId`, `ingredientName`, `amount`, `fdcId`, and 8 nutrient fields
- [ ] #5 AC5: `sum(breakdown[].calories)` equals `totals.calories` (±1, per F18)
- [ ] #6 AC6: `npm run build` passes after change
- [ ] #7 AC7: Version bump v1.0.0 → v1.1.0 with `change_log` entry summarizing nutrition addition; `change_log[].ingredients` snapshot included per F34
- [ ] #8 AC8: Print page (`/recipe/tartine-rugelach/print`) renders nutrition section instead of "not yet generated" placeholder (visual check on bake detail HITL)
<!-- SECTION:DESCRIPTION:END -->
<!-- AC:END -->
