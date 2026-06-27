---
id: DRAFT-123
title: 'ExperimentPanel reset bug — trash icon may not clear state, no full-reset path'
status: Draft
assignee: []
created_date: '2026-06-27 22:06'
labels:
  - ungroomed
  - bug
  - ux
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Observed

During 2026-06-27 jalapeño cheddar sourdough bake, user noticed ExperimentPanel showed stale baseline (cheddar 220→320g delta) even after attempting to clear state via trash icon. Recipe baseline is actually 320g (no delta needed), but the panel persistently showed the old 220g baseline.

## Hypothesis

Trash icon may only clear adjustment values, not the cached baseline reference. localStorage `proofed:experiment:{recipeId}` key may persist after trash click. Possible UI/code divergence — exported `experimentExport` showed `originalAmount: 220, adjustedAmount: 320` indicating stale data.

## Asks

1. Verify trash icon behavior — does it call clear/reset on the experiment store?
2. Add explicit "Reset all" action that nukes the localStorage key entirely
3. Investigate whether baseline refresh happens on recipe version bump

## Source

Bake log 2026-06-27 cook_log entry next_time item.
<!-- SECTION:DESCRIPTION:END -->
