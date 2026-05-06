---
id: PF-235
title: Calculate nutrition data for BA's Best Bolognese
status: To Do
assignee: []
created_date: '2026-05-06 19:36'
labels:
  - nutrition
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for ba-bolognese.json. Recipe yields 4 servings. Follow nutrition calculation pattern from existing recipes (e.g., coco-curry, atk-cinnamon-buns-ultimate).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 nutrition block in ba-bolognese.json has non-null totals and perServing
- [ ] #2 servings = 4 (matches meta.yields)
- [ ] #3 sum(breakdown.calories) = totals.calories ±1
- [ ] #4 perServing = totals / servings ±0.1
- [ ] #5 All ingredients with >0 calories listed in breakdown (skip salt, bay leaf, nutmeg pinch)
- [ ] #6 Each breakdown entry has fdcId for traceability
<!-- AC:END -->
