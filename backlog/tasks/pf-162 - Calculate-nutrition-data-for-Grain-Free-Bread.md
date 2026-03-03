---
id: PF-162
title: Calculate nutrition data for Grain-Free Bread
status: To Do
assignee: []
created_date: '2026-03-03 06:22'
labels:
  - nutrition
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for grain-free-bread.json. Follow the nutrition calculation pattern established in existing recipes (e.g., simple-sourdough.json).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 nutrition block in grain-free-bread.json has non-null totals and perServing
- [ ] #2 servings matches parsed yields (12 slices)
- [ ] #3 sum(breakdown.calories) = totals.calories ±1
- [ ] #4 perServing = totals / servings ±0.1
- [ ] #5 All ingredients with >0 calories listed in breakdown
- [ ] #6 Each breakdown entry has fdcId for traceability
<!-- AC:END -->
