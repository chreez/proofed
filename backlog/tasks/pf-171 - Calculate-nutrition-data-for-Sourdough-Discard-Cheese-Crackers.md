---
id: PF-171
title: Calculate nutrition data for Sourdough Discard Cheese Crackers
status: To Do
assignee: []
created_date: '2026-03-31 06:36'
labels:
  - nutrition
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for sourdough-discard-cheese-crackers.json. Follow the nutrition calculation pattern established in existing recipes (see sourdough-chocolate-chip-cookies.json for reference).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 nutrition block in sourdough-discard-cheese-crackers.json has non-null totals and perServing
- [ ] #2 servings matches parsed yields
- [ ] #3 sum(breakdown.calories) = totals.calories ±1
- [ ] #4 perServing = totals / servings ±0.1
- [ ] #5 All ingredients with >0 calories listed in breakdown
- [ ] #6 Each breakdown entry has fdcId for traceability
<!-- AC:END -->
