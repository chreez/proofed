---
id: PF-159
title: Calculate nutrition data for Sourdough Cheddar Bay Biscuits
status: Done
assignee: []
created_date: '2026-02-24 23:49'
updated_date: '2026-02-24 23:52'
labels:
  - nutrition
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for sourdough-cheddar-bay-biscuits.json. Follow the nutrition calculation pattern established in existing recipes (e.g., sourdough-cheddar-cheese.json).

Recipe yields ~10 biscuits. Key ingredients: AP flour (220g), sourdough discard (130g), buttermilk (150g), butter (160g total), sharp cheddar (150g), baking powder (14g), baking soda (3g), garlic powder (7.5g), onion powder (3g), sugar (8g), salt (5g), cayenne (0.3g), parsley (4g).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 nutrition block in sourdough-cheddar-bay-biscuits.json has non-null totals and perServing
- [ ] #2 servings matches parsed yields (~10 biscuits)
- [ ] #3 sum(breakdown.calories) = totals.calories ±1
- [ ] #4 perServing = totals / servings ±0.1
- [ ] #5 All ingredients with >0 calories listed in breakdown
- [ ] #6 Each breakdown entry has fdcId for traceability
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Nutrition data calculated inline during recipe creation using USDA FDC reference data. 10 servings (1 biscuit each), 291.6 cal/serving, 13 ingredients in breakdown. All acceptance criteria met: non-null totals and perServing, breakdown sum matches totals, fdcId for all ingredients (null for sourdough discard as expected).
<!-- SECTION:FINAL_SUMMARY:END -->
