---
id: DRAFT-55
title: Hydration calculator tool — recipe-aware dough hydration readout
status: Draft
assignee: []
created_date: '2026-04-10 17:01'
labels:
  - scaling
  - tooling
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A standalone hydration calculator tool on the recipe page (or as a utility page) that shows the current hydration percentage for any recipe. The tool should:

1. Auto-populate from a recipe dropdown — select a recipe, and the tool pre-fills flour weight, water weight, and starter contribution (assuming 1:1 starter = 50% flour + 50% water)
2. Show live hydration % as ingredients are adjusted (especially useful when scaling)
3. Account for starter hydration in the calculation: `hydration = (water + starter_water) / (flour + starter_flour) * 100`
4. Update in real-time when the scaling multiplier changes
5. Could live as a section on the recipe page or as a dedicated utility

## Why this matters
For bread recipes, hydration is the single most important ratio. When scaling, the user needs to verify the final hydration hasn't drifted — especially with non-linear starter adjustments. This tool makes that verification instant.

## Prior art
- The scaling spikes (PF-183.x) already classified ingredients and calculated hydration impacts
- The provide/inject scaling architecture (PF-183) already has the multiplied values available
<!-- SECTION:DESCRIPTION:END -->
