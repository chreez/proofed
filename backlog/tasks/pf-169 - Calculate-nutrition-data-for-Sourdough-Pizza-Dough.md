---
id: PF-169
title: Calculate nutrition data for Sourdough Pizza Dough
status: To Do
assignee: []
created_date: '2026-03-22 22:46'
labels:
  - nutrition
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for sourdough-pizza-dough.json. Follow the nutrition calculation pattern established in existing recipes (ny-style-pizza.json as reference). Key ingredients: bread flour (413g), water (238g), sourdough starter (100g), salt (8g), diastatic malt powder (4g), plus toppings (same as NY-style).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 nutrition block in sourdough-pizza-dough.json has non-null totals and perServing
- [ ] #2 servings matches parsed yields (2)
- [ ] #3 sum(breakdown.calories) = totals.calories ±1
- [ ] #4 perServing = totals / servings ±0.1
- [ ] #5 All ingredients with >0 calories listed in breakdown
- [ ] #6 Each breakdown entry has fdcId for traceability
- [ ] #7 Sourdough starter nutrition calculated as 50% bread flour + 50% water
<!-- AC:END -->
