---
id: PF-253
title: Calculate nutrition data for Tartine Rugelach
status: To Do
assignee: []
created_date: '2026-05-11 19:49'
labels:
  - nutrition
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for tartine-rugelach.json. Follow the nutrition calculation pattern established in existing recipes (see atk-cinnamon-buns-ultimate.json for reference structure).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 nutrition block in tartine-rugelach.json has non-null totals and perServing
- [ ] #2 servings matches parsed yields (16 rugelach)
- [ ] #3 sum(breakdown.calories) = totals.calories +/- 1
- [ ] #4 perServing = totals / servings +/- 0.1
- [ ] #5 All ingredients with >0 calories listed in breakdown
- [ ] #6 Each breakdown entry has fdcId for traceability
<!-- AC:END -->
