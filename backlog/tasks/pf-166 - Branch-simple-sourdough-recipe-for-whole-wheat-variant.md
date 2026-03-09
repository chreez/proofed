---
id: PF-166
title: Branch simple sourdough recipe for whole wheat variant
status: To Do
assignee: []
created_date: '2026-03-09 00:21'
updated_date: '2026-03-09 01:33'
labels:
  - recipe
  - variant
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a flavor-focused variant of simple sourdough as a separate recipe file, swapping some bread flour for whole wheat and/or rye — whatever research says gives the best flavor payoff without adding complexity. Same simple workflow (mix, fold, overnight bulk, shape, cold proof, bake), just better flavor.

Motivated by desire for "more complexity" noted across bake logs #5, #6, #7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Research spike (subtask) completed using /research skill with documented findings on: optimal bread flour / whole wheat / rye blend ratios for flavor, hydration adjustment per % of whole grain, fermentation timing impact, and any shaping considerations
- [ ] #2 New recipe JSON file created (e.g., simple-sourdough-wheat.json) as a separate file in public/recipes/
- [ ] #3 Recipe added to public/recipes/index.json
- [ ] #4 Recipe uses the same stage structure as simple-sourdough (mix, fold, overnight bulk, shape, cold proof, bake) — no new stages or complexity
- [ ] #5 Flour blend and hydration adjusted per spike findings, with rationale fields citing the research
- [ ] #6 All other ingredients (salt, starter) recalculated if ratios change
- [ ] #7 meta.source references simple-sourdough as the base recipe with type: adapted
- [ ] #8 Nutrition block recalculated for the new flour blend
- [ ] #9 Recipe passes /validate (D1-D16, S1-S5)
- [ ] #10 First bake logged against this recipe to verify the numbers work in practice
<!-- AC:END -->
