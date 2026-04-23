---
id: DRAFT-67
title: Backfill cost items on latest-version bakes for print readiness
status: Draft
assignee: []
created_date: '2026-04-23 16:55'
labels:
  - data
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context
Print page PV4 check requires cost.items[] with itemized breakdown. Many bakes only have cost.total or no cost data. Only latest version of each recipe needs items for print page to pass.

## Scope — Latest Version Only
Backfill cost items on bakes matching recipe's current major version. Older version bakes are historical.

### Needs items[] (have totals):
- gochujang-garlic-buns v2.0.0: 2026-04-19, 2026-04-22
- simple-sourdough-wheat v1.0.0: 2026-04-21
- sourdough-cinnamon-buns v1.1.0: 2026-02-19, 2026-03-20
- birote-salado v1.1.0: 2026-03-05, 2026-03-07

### Needs full cost data (no cost at all):
- atk-cinnamon-buns-ultimate v1.2.0: 2026-02-10
- ny-style-pizza v1.3.0: 2026-02-22
- sourdough-pizza-dough v1.3.0: 2026-03-24

### Already good:
- simple-sourdough, sourdough-cheddar-cheese, ny-style-pizza (2026-02-18), gochujang (2026-04-17), sourdough-pizza-dough (2026-04-11)

## Process per bake
1. HEB product search per ingredient
2. Calculate proportional cost per recipe amount
3. Write cost.items[] with full schema
4. Recalculate cost.total and cost.perServing
5. Run /validate-print to confirm PV4

## AC
- [ ] Every recipe has >=1 latest-version bake with populated cost.items[]
- [ ] /validate-print PV4 passes for all recipes
- [ ] Print page renders cost breakdown table for all recipes
<!-- SECTION:DESCRIPTION:END -->
