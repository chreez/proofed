---
id: PF-205
title: 'Fractional recipe scaling (0.5×, 1.5× etc.)'
status: Done
assignee: []
created_date: '2026-04-15 18:44'
updated_date: '2026-04-15 19:13'
labels:
  - enhancement
dependencies: []
references:
  - src/composables/useScaling.ts
  - src/components/ScalingControl.vue
  - src/composables/useScratchpad.ts
  - src/types/recipe.ts
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Allow recipes to be scaled by fractional amounts (halved, 1.5×) not just integer multipliers. Currently `availableMultipliers` only generates integers. Important for mise en place calculation — e.g., halving simple sourdough.

Also: scratchpad JSON export currently omits active multiplier value — needs to be included.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scaling.tested_range.min accepts values < 1 (e.g., 0.5)
- [ ] #2 availableMultipliers in useScaling.ts and ScalingControl.vue generates fractional steps (0.5 increments from min through max+2)
- [ ] #3 ScalingControl buttons display fractional values clearly (e.g., ½×, 1×, 1½×, 2×)
- [ ] #4 All scaling math (scaleIngredient, scaleComponentAmount, scaleNutrition, getScaledYields) works correctly with fractional multipliers — verified with tests
- [ ] #5 getScaledYields display string works for fractions (e.g., '4 buns (½×)')
- [ ] #6 Scratchpad exportJson() includes active multiplier value in output
- [ ] #7 isUntested check works correctly with fractional values below tested range
- [ ] #8 Existing integer-only scaling (pizza dough) unaffected — no regression
- [ ] #9 Checklist S7 updated if needed: tested_range.min >= 0.5 valid
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Key gap (user-flagged):** Scratchpad JSON export currently has NO multiplier field. When a user scales a recipe and exports scratchpad notes, the multiplier context is lost. AC #6 is critical — the bake log agent needs to know what scale was used.
<!-- SECTION:NOTES:END -->
