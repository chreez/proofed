---
id: DRAFT-121
title: 'Cost breakdown: ''servings'' label wrong for breads (use ''loaves'')'
status: Draft
assignee: []
created_date: '2026-05-26 17:19'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On bake detail pages (and possibly print/IG share), cost breakdown shows '2 servings' (or '1 servings') as a count label above total cost. For breads this should read 'loaves' (or the recipe-defined unit), not 'servings'.

Context: 2026-05-26 simple-sourdough bake. Single-loaf cost wired as servings=1 — UI rendered '1 servings'. The recipe's nutrition.servings is 10 (per-slice), but cost.servings is the unit count (loaves). Mixing the two terms is confusing.

Possible direction:
- Add unit label to cost block (`cost.unitLabel: 'loaves'` / 'cookies' / 'tarts' etc.), default to 'servings' for backward compat.
- OR derive from recipe.meta.yields (parse '2 loaves (~800g each baked)' → 'loaves').
- Pluralize properly (1 loaf, 2 loaves).

Touch points: bake detail cost breakdown component, print page cost block, IG share caption (L2 spend lines).
<!-- SECTION:DESCRIPTION:END -->
