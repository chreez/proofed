---
id: DRAFT-53
title: Scaling-aware clipboard copy and cost calculation
status: Draft
assignee: []
created_date: '2026-04-09 21:48'
labels:
  - scaling
dependencies:
  - PF-183
references:
  - 'src/components/RecipeMeta.vue:61'
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When the scaling multiplier is active, "Copy Recipe" (Paprika format) in RecipeMeta.vue uses raw `ing.total` values — not scaled. The full recipe paste should reflect the active multiplier.

Additionally, future cost calculation should account for the scaling multiplier when computing per-bake costs.

## Gaps identified
1. `formatRecipeForPaprika()` in RecipeMeta.vue — uses `ing.total` directly, needs `ing.total * multiplier`
2. Cost calculation (when implemented) — should multiply ingredient costs by multiplier
3. Per-section copy (`formatGatherForCopy` in GatherSection) — already uses scaled `ingredientItems`, no fix needed

## Notes
- Minor code change for #1 (just multiply by `scaling.multiplier.value`)
- Cost calculation is a future concern — defer until cost feature lands
<!-- SECTION:DESCRIPTION:END -->
