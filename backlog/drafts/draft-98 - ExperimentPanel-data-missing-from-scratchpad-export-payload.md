---
id: DRAFT-98
title: ExperimentPanel data missing from scratchpad export payload
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

## Acceptance Criteria
- Scratchpad export JSON includes `experiment` block (or equivalent) when ExperimentPanel has values
- Block is omitted when ExperimentPanel is empty/cleared
- /bake-log skill can read and silently apply the values during snapshot resolution
- Backward compat: exports without the block continue to work (fall back to prompting)
<!-- SECTION:DESCRIPTION:END -->
