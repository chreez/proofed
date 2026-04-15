---
id: DRAFT-64
title: Calculate nutrition data for Gochujang & Garlic Savoury Buns
status: Draft
assignee: []
created_date: '2026-04-15 18:34'
labels:
  - nutrition
dependencies: []
references:
  - public/recipes/gochujang-garlic-buns.json
  - >-
    photos-source/gochujang-garlic-buns/research/gochujang-garlic-buns-research-synthesis.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for gochujang-garlic-buns.json. Follow the nutrition calculation pattern established in existing recipes (e.g., ATK cinnamon buns).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 nutrition block in gochujang-garlic-buns.json has non-null totals and perServing
- [ ] #2 servings = 10 (matches parsed yields)
- [ ] #3 sum(breakdown.calories) = totals.calories ±1
- [ ] #4 perServing = totals / servings ±0.1
- [ ] #5 All ingredients with >0 calories listed in breakdown
- [ ] #6 Each breakdown entry has fdcId for traceability
<!-- AC:END -->
