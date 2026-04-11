---
id: DRAFT-60
title: Add bakeStatsSchema config for sourdough-pizza-dough recipe
status: Draft
assignee: []
created_date: '2026-04-11 18:31'
labels:
  - recipe-data
dependencies: []
references:
  - public/recipes/sourdough-pizza-dough.json
  - src/types/recipe.ts (BakeStatsSchema)
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The sourdough-pizza-dough recipe currently has no `config.bakeStatsSchema` — meaning bake log sessions skip all structured stats prompts (dough temps, stretch folds, aliquot rises, etc.). The 2026-04-11 bake log has rich timestamped data in raw_notes that could have been captured as structured stats.

Define which stat fields are relevant for pizza dough bakes and add the schema to the recipe JSON config block.
<!-- SECTION:DESCRIPTION:END -->
