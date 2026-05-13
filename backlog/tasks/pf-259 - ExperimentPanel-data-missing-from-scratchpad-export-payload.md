---
id: PF-259
title: ExperimentPanel data missing from scratchpad export payload
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
ExperimentPanel adjustments (custom ingredient amounts) are NOT included in the scratchpad export JSON. This breaks /bake-log fidelity — the user has to manually relay the dial values to the agent.

## Observed
During 2026-05-13 jalapeno-cheddar-sourdough bake:
- User entered 147g jalapeño + 316g cheddar in ExperimentPanel before bake
- Scratchpad export JSON contained step entries and general notes but NO ExperimentPanel block
- Agent had to ask user verbally for the custom amounts

## Expected
Scratchpad export should include an `experiment` block at the top level mirroring `proofed:experiment:{recipeId}` localStorage state. Format:
```json
{
  "experiment": [
    { "ingredientId": "jalapenos", "total": 147 },
    { "ingredientId": "cheddar", "total": 316 }
  ]
}
```

## Why this matters
/bake-log resolution (PF-244) expects ExperimentPanel adjustments to be applied silently as the first step of snapshot resolution. Without the data in the export, the silent-apply pathway fails and resolution defaults to prompting the user for every delta.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 BakeScratchpad type in src/types/recipe.ts includes optional experiment field as Array of { ingredientId: string; total: number }
- [ ] #2 exportJson() in useScratchpad.ts reads proofed:experiment:{recipeId} localStorage and includes the experiment array when non-empty
- [ ] #3 experiment block omitted entirely when ExperimentPanel has no values (empty/default state)
- [ ] #4 Unit test: export with active ExperimentPanel includes block; export with empty panel omits it
- [ ] #5 Manual repro on 2026-05-13 jalapeno-cheddar-sourdough: scratchpad export now contains experiment block when user has dialed amounts
<!-- AC:END -->
