---
id: DRAFT-28
title: Calculate nutrition data for Sourdough Chocolate Chip Cookies
status: Draft
assignee: []
created_date: '2026-02-28 04:39'
labels:
  - nutrition
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for sourdough-chocolate-chip-cookies.json. Follow the nutrition calculation pattern established in existing recipes. Currently has zeroed-out placeholder values.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 nutrition block has non-null totals and perServing with real values
- [ ] #2 servings = 50 (matches parsed yields)
- [ ] #3 sum(breakdown.calories) = totals.calories ±1
- [ ] #4 perServing = totals / servings ±0.1
- [ ] #5 All ingredients with >0 calories listed in breakdown
- [ ] #6 Each breakdown entry has fdcId for traceability
<!-- AC:END -->
