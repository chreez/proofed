---
id: PF-82
title: Increase NY pizza yield by 25%
status: Done
assignee: []
created_date: '2026-02-09 04:18'
updated_date: '2026-02-09 06:16'
labels:
  - recipe-data
dependencies:
  - PF-83
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Scale dough ingredients up 25% while maintaining baker's percentages. Update yields/servings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All dough ingredients multiplied by 1.25
- [ ] #2 Baker's percentages remain identical (flour = 100% base)
- [ ] #3 meta.yields updated to reflect new portion count/size
- [ ] #4 Topping amounts scaled proportionally
- [ ] #5 Nutrition block recalculated for new amounts
- [ ] #6 D6 (breakdown sums) and F17-F19 (nutrition) checks pass
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Scaled all dough and topping ingredients ×1.25. Kept 2 pizzas at ~388g per ball (bigger pies, not more pies). Nutrition recalculated for 2 servings. Version bumped to v1.1.0.
<!-- SECTION:FINAL_SUMMARY:END -->
