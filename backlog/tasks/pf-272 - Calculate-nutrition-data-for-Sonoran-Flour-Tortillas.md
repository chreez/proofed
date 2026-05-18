---
id: PF-272
title: Calculate nutrition data for Sonoran Flour Tortillas
status: To Do
assignee: []
created_date: '2026-05-18 04:55'
labels:
  - nutrition
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FoodData Central to calculate per-ingredient nutrition for public/recipes/sonoran-flour-tortillas.json. Recipe is 4 ingredients: Sonora '00' soft white wheat flour (300g), fine sea salt (5g), lard/manteca (60g), water (180g). Yields 10 tortillas (servings=10). Follow nutrition pattern from existing recipes (e.g. birote-salado.json).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 nutrition block in sonoran-flour-tortillas.json has non-null totals and perServing
- [ ] #2 servings = 10 (matches parsed yields)
- [ ] #3 sum(breakdown.calories) = totals.calories within 1 cal tolerance
- [ ] #4 perServing = totals/servings within 0.1 tolerance
- [ ] #5 all ingredients with >0 calories listed in breakdown
- [ ] #6 each breakdown entry has fdcId for traceability
<!-- AC:END -->
