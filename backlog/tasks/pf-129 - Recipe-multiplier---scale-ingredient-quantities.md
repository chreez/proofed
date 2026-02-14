---
id: PF-129
title: Recipe multiplier - scale ingredient quantities
status: To Do
assignee: []
created_date: '2026-02-13 02:10'
updated_date: '2026-02-13 03:46'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a multiplier control to recipe view that scales all ingredient quantities. Common use case: doubling pizza dough to make 4 balls instead of 2. Should update all ingredient totals, component amounts in states, and yield display.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A multiplier control is visible in the recipe header area, integrating seamlessly with existing header elements
- [ ] #2 Selecting a multiplier value scales all `Ingredient.total` values in gather sections by the chosen factor
- [ ] #3 All `IngredientBreakdown.amount` values scale by the same factor, and `sum(breakdown.amount) === scaled total` for every ingredient
- [ ] #4 All `StateComponent.amount` strings are parsed and their numeric values scaled by the factor (display-only, no JSON mutation)
- [ ] #5 Nutrition `totals` scale by the multiplier; `perServing` remains unchanged; displayed `servings` reflects the scaled count
- [ ] #6 The `meta.yields` display indicates the active multiplier (e.g., "8 buns" → "16 buns (x2)") where yields are parseable, or shows the raw multiplier badge when not
- [ ] #7 Multiplier is display-only — no recipe JSON is modified; resetting to 1x restores original values exactly
- [ ] #8 A validation check (added to checklist) verifies that at any multiplier, ingredient totals equal the sum of their breakdowns and state component amounts reference correct scaled values
- [ ] #9 npm run build passes
<!-- AC:END -->
