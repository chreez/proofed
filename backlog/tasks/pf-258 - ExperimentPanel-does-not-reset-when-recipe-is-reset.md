---
id: PF-258
title: ExperimentPanel does not reset when recipe is reset
status: Draft
assignee: []
created_date: '2026-05-13 21:35'
updated_date: '2026-05-13 22:18'
labels:
  - bug
  - scratchpad
  - experiment-panel
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
<!-- SECTION:DESCRIPTION:BEGIN -->
ExperimentPanel adjustments persist after the user resets the recipe state. Should clear alongside step state on recipe reset.

## Repro
1. Open recipe (e.g. jalapeno-cheddar-sourdough)
2. Open ExperimentPanel, dial in custom amounts (e.g. cheddar 316g, jalapeño 147g)
3. Reset the recipe via the reset action
4. Re-open ExperimentPanel → still shows old custom values

## Expected
Reset should clear `proofed:experiment:{recipeId}` localStorage key. ExperimentPanel UI should reflect empty/default state.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 handleReset() in src/App.vue clears ExperimentPanel state alongside progress + scratchpad
- [ ] #2 After reset, localStorage.getItem('proofed:experiment:{recipeId}') returns null
- [ ] #3 ExperimentPanel.vue UI re-renders with all sliders at recipe baseline values
- [ ] #4 Unit test covers reset flow clearing all three (progress, scratchpad, experiment)
- [ ] #5 Manual repro on jalapeno-cheddar-sourdough shows ExperimentPanel empty after reset
<!-- AC:END -->
