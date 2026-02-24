---
id: PF-158
title: Calculate nutrition data for Sourdough Cheddar Cheese Bread
status: Done
assignee: []
created_date: '2026-02-24 02:23'
updated_date: '2026-02-24 02:24'
labels:
  - nutrition
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for sourdough-cheddar-cheese.json. Follow the nutrition calculation pattern established in existing recipes (e.g., simple-sourdough, carrot-cake). 6 ingredients: bread flour (1000g), water (670g), starter (200g), salt (18g), Tillamook sharp cheddar (226g), unsalted butter (14g).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 nutrition block in sourdough-cheddar-cheese.json has non-null totals and perServing
- [ ] #2 servings matches parsed yields (2 loaves)
- [ ] #3 sum(breakdown.calories) = totals.calories ±1
- [ ] #4 perServing = totals / servings ±0.1
- [ ] #5 All ingredients with >0 calories listed in breakdown
- [ ] #6 Each breakdown entry has fdcId for traceability
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Nutrition calculated inline during recipe creation. Per-loaf amounts based on USDA FDC data. 248 cal/slice, 9.4g protein, 5.1g fat. Cheddar adds significant fat (36.3g/loaf) and sodium (726.5mg/loaf).
<!-- SECTION:FINAL_SUMMARY:END -->
