---
id: PF-145
title: Calculate nutrition data for Sourdough Cinnamon Buns
status: Done
assignee: []
created_date: '2026-02-17 04:40'
updated_date: '2026-02-17 04:45'
labels:
  - nutrition
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for sourdough-cinnamon-buns.json. Follow the nutrition calculation pattern established in existing recipes. Currently has a zeroed placeholder.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 nutrition block in sourdough-cinnamon-buns.json has non-null totals and perServing with real values
- [x] #2 servings = 8 matches parsed yields
- [x] #3 sum(breakdown.calories) = totals.calories ±1
- [x] #4 perServing = totals / servings ±0.1
- [x] #5 All ingredients with >0 calories listed in breakdown
- [x] #6 Each breakdown entry has fdcId for traceability
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Calculated full USDA FDC nutrition for sourdough-cinnamon-buns.json. 15 ingredients in breakdown (water excluded, starter split into flour portion only). Totals: 6669 cal, 91g protein, 294g fat, 927g carbs. Per serving (8 buns): 834 cal. All FDC IDs traced. Breakdown sum matches totals exactly.
<!-- SECTION:FINAL_SUMMARY:END -->
