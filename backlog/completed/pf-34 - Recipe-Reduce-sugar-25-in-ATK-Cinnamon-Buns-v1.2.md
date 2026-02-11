---
id: PF-34
title: 'Recipe: Reduce sugar 25% in ATK Cinnamon Buns (v1.2)'
status: Done
assignee: []
created_date: '2026-02-07 00:42'
updated_date: '2026-02-07 00:46'
labels:
  - recipe
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reduce all sugar by ~25% across the board in the quick cinnamon buns recipe. Bump to v1.2 with change_log entry.\n\nCurrent → Target:\n- Brown sugar: 149g → 112g (filling)\n- Granulated sugar: 75g → 56g (38g filling + 18g dough)\n- Confectioners' sugar: 113g → 85g (glaze)\n\nGlaze compensation: Offset thinner glaze by increasing cream cheese from 85g → ~113g. Keeps net glaze weight and adds body/tang without sweetness.\n\nBaking soundness notes:\n- Dough: 7g less sugar is negligible — baking powder is primary leavener. No liquid adjustment needed.\n- Filling: Less caramelization but structurally fine. No ratio issues.\n- Glaze: Cream cheese increase compensates for thinner consistency from less powdered sugar.\n\nMust re-validate all allocation checks (R2-R5) and nutrition data (F17-F22) after changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Brown sugar reduced from 320g to 240g (~25%)
- [x] #2 Granulated sugar reduced from 100g to 75g (~25%)
- [x] #3 Confectioners' sugar reduced from 170g to 128g (~25%)
- [x] #4 Cream cheese increased from 113g to 150g to offset glaze consistency
- [x] #5 All ingredient breakdown sums still equal totals (D6)
- [x] #6 Butter allocation unchanged and still sums correctly (R2)
- [x] #7 Salt allocation unchanged and still sums correctly (R3)
- [x] #8 Sugar allocations updated in both ingredients and state components
- [x] #9 Milk allocation unchanged (R5)
- [x] #10 Version bumped to v1.2.0 in recipe JSON
- [x] #11 change_log entry documents sugar reduction + cream cheese offset
- [x] #12 Nutrition data recalculated: 856 kcal/bun → 801 kcal/bun, sugar 74.2g → 56.4g per serving
- [x] #13 Build passes (106 tests, no type errors)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reduced all sugars ~25% in ATK Ultimate Cinnamon Buns, bumped to v1.2.0.\n\nIngredient changes:\n- Brown sugar: 320g → 240g (filling)\n- Granulated sugar: 100g → 75g (dough)\n- Confectioners' sugar: 170g → 128g (glaze)\n- Cream cheese: 113g → 150g (glaze offset)\n\nUpdated in both ingredients list and state components (MIX_DRY, MIX_FILLING, MAKE_GLAZE).\n\nNutrition impact (per bun):\n- Calories: 856 → 801 kcal (-6.4%)\n- Sugar: 74.2g → 56.4g (-24%)\n- Fat increased slightly due to cream cheese: 31.2g → 32.7g\n\nNote: Task ACs were originally written against ATK quick recipe amounts (149g/75g/113g brown/gran/powdered). Actual recipe had different amounts (320g/100g/170g). Applied 25% reduction to real values.
<!-- SECTION:FINAL_SUMMARY:END -->
