---
id: PF-260
title: Calculate nutrition data for Lime Chantilly
status: Draft
assignee: []
created_date: '2026-05-14 01:53'
labels:
  - nutrition
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use USDA FDC database to calculate per-ingredient nutrition for lime-chantilly.json. Follow nutrition pattern from existing recipes (carrot-cake, tartine-lemon-cream-tart). Recipe yields ~240g cream — set servings based on rosette count (10-12 servings, 1 rosette each). Ingredients: heavy cream 240g, block cream cheese 120g, powdered sugar 50g, lime zest 1g, lime juice 5g (optional), vanilla 2.5g (optional), fine salt pinch, flake salt for finish.

Acceptance Criteria:
- nutrition block in lime-chantilly.json has non-null totals and perServing
- servings = 10 (1 rosette per serving)
- sum(breakdown.calories) = totals.calories ±1
- perServing = totals / servings ±0.1
- All ingredients with >0 calories listed in breakdown
- Each breakdown entry has fdcId for traceability
<!-- SECTION:DESCRIPTION:END -->
