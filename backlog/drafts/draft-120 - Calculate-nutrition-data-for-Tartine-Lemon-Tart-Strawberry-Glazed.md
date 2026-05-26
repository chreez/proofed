---
id: DRAFT-120
title: 'Calculate nutrition data for Tartine Lemon Tart, Strawberry-Glazed'
status: Draft
assignee: []
created_date: '2026-05-26 21:05'
labels:
  - nutrition
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for public/recipes/tartine-lemon-tart-strawberry-glazed.json. 12 tartlets, servingsPerItem 1.

Ingredients to look up (gather across stages):
- Pate sucree (DOUGH): unsalted butter 255g, sugar 200g, salt 1.5g, eggs 2 large, AP flour 500g
- Egg wash (LINE): 1 yolk + 15g heavy cream
- Chablonnage (CHABLONNAGE): white chocolate 60g
- Lemon cream (CREAM): lemon juice 200g, eggs 3 large, yolk 1, sugar 175g, salt 0.5g, butter 225g
- Topping (STRAWBERRY): strawberries 960g (12 x 80g per tartlet), lemon zest 2g
- Glaze (GLAZE): red currant jelly 160g, water 60g

Cross-reference canonical tartine-lemon-cream-tart nutrition block for shared ingredient overlap. New deltas vs canonical: chablonnage chocolate, strawberries, currant jelly, yolk+cream wash (replaces canonical whole-egg+salt wash). Whip ingredients removed (240g cream, 8g sugar).

## Acceptance Criteria
- nutrition block has non-null totals and perServing
- servings = 12 (matches yields and config.stats.defaultYield)
- sum(breakdown.calories) = totals.calories +/- 1
- perServing = totals / 12 +/- 0.1
- All ingredients with >0 calories listed in breakdown
- Each breakdown entry has fdcId for traceability
<!-- SECTION:DESCRIPTION:END -->
