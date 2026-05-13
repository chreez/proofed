---
id: DRAFT-97
title: ExperimentPanel does not reset when recipe is reset
status: Draft
assignee: []
created_date: '2026-05-13 21:35'
labels:
  - bug
  - scratchpad
  - experiment-panel
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ExperimentPanel adjustments persist after the user resets the recipe state. Should clear alongside step state on recipe reset.

## Repro
1. Open recipe (e.g. jalapeno-cheddar-sourdough)
2. Open ExperimentPanel, dial in custom amounts (e.g. cheddar 316g, jalapeño 147g)
3. Reset the recipe via the reset action
4. Re-open ExperimentPanel → still shows old custom values

## Expected
Reset should clear `proofed:experiment:{recipeId}` localStorage key. ExperimentPanel UI should reflect empty/default state.

## Acceptance Criteria
- Reset action clears `proofed:experiment:{recipeId}` localStorage key
- ExperimentPanel UI reflects empty/default state after reset
- Tested on jalapeno-cheddar-sourdough recipe (where bug was observed)

## Source
Surfaced during /bake-log session 2026-05-13 for jalapeno-cheddar-sourdough. User entered 147g jalapeño and 316g cheddar in ExperimentPanel during prep, noted as meta observation at 9:50pm Mon. Include snapshot of current ExperimentPanel state in any future repro.
<!-- SECTION:DESCRIPTION:END -->
