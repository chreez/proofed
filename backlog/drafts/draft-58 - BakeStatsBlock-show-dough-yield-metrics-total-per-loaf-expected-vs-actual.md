---
id: DRAFT-58
title: 'BakeStatsBlock: show dough yield metrics (total, per-loaf, expected vs actual)'
status: Draft
assignee: []
created_date: '2026-04-10 18:03'
labels:
  - ux
dependencies: []
references:
  - src/components/BakeStatsBlock.vue
  - src/types/recipe.ts
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From bake 15 (2026-04-10) review:

Bake stats should surface dough yield data when available:

1. **Total dough weight after bulk** — e.g., 1925g (this bake)
2. **Per-loaf weights** — e.g., 962.5g target per loaf
3. **Expected yield** — derived from recipe ingredients total (flour + water + starter + salt = expected total)
4. **Actual vs expected delta** — difference between measured total and expected total. Highlights flour absorption, evaporation, or measurement error.

This data already exists in notes for some bakes but isn't structured or rendered. Could live in `bake_stats` as a new field group (e.g., `dough_weights`) or as top-level entry fields.

Reference: simple-sourdough 2026-04-10 — note 9 has "total dough 1925g, target 962.5g per loaf"
<!-- SECTION:DESCRIPTION:END -->
