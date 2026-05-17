---
id: PF-259
title: ExperimentPanel data missing from scratchpad export payload
status: Done
assignee: []
created_date: '2026-05-13 21:35'
updated_date: '2026-05-17 19:38'
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
- [x] #1 useScratchpad.exportJson(multiplier?, experimentExport?) accepts optional ExperimentExport second arg; when truthy with adjustments.length > 0, returned BakeScratchpad includes experimentExport populated verbatim
- [x] #2 When experimentExport arg is undefined/null OR its adjustments.length === 0, returned BakeScratchpad has NO experimentExport key (key fully omitted, not null/undefined/{}); existing exports for recipes without experiment config remain byte-identical to pre-fix output
- [x] #3 useScratchpad.exportJsonString(multiplier?, experimentExport?) mirrors the signature and forwards the arg to exportJson
- [x] #4 useExperimentStorage returns buildCurrentExport(): ExperimentExport | null helper that internally calls buildExperimentExport() with current adjustments, derivedValues, config, and multiplier; returns null when adjustments map is empty OR every adjustment equals the config defaultAmount
- [x] #5 App.vue handleCopyScratchpad (line 305) calls scratchpad.value.exportJsonString(scalingMultiplier.value, experimentStorageInstance?.buildCurrentExport() ?? undefined)
- [x] #6 Unit test in useScratchpad.spec.ts: calling exportJson(1, mockExperimentExport) with two adjustments produces output where result.experimentExport deep-equals mockExperimentExport
- [x] #7 Unit test in useScratchpad.spec.ts: calling exportJson(1, null) and exportJson(1, { adjustments: [] }) both produce output where 'experimentExport' in result === false
- [x] #8 Unit test in useScratchpad.spec.ts: calling exportJson() with no second arg is byte-identical to pre-change behavior — no experimentExport key
- [x] #9 Unit test in useExperimentStorage.spec.ts: buildCurrentExport() returns null when adjustments map empty; returns ExperimentExport with correct adjustments[] when ≥1 adjusted ingredient differs from default
- [x] #10 Manual repro documented in task notes: re-run on jalapeno-cheddar-sourdough recipe with non-default jalapeño/cheddar values dialed; copy scratchpad payload; verify pasted JSON contains experimentExport.adjustments with both ingredients before marking Done
- [x] #11 No changes to BakeScratchpad or ExperimentExport type shapes — both already exist in src/types/recipe.ts
- [x] #12 npm run build passes (BV1-BV3)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation (2026-05-16)

Wired ExperimentPanel adjustments into scratchpad export via existing buildExperimentExport() infra.

**Files changed:**
- src/composables/useExperimentStorage.ts (+43): new ExperimentExportDeps interface, optional 5th arg, new buildCurrentExport() method
- src/composables/useScratchpad.ts (+12/-3): added optional experimentExport? 2nd arg to exportJson + exportJsonString with spread-conditional inclusion
- src/App.vue (+33/-3): new experimentDerivedSnapshot computed, threaded buildCurrentExport() into handleScratchpadExport
- src/composables/useScratchpad.spec.ts (+96): 6 new tests
- src/composables/useExperimentStorage.spec.ts (+118): 5 new tests

**Tests:** 11 new, all pass. Full suite 2703/2703. No snapshots updated.

**Build:** npm run build exit 0 — vitest + vue-tsc + bundle + prerender-og all green.

**Notes:**
- Derived value mapping handles effective_hydration / inclusion_load / total_dough_weight types. 'custom' formula type silently skipped (no formula evaluator yet).
- App.spec.ts mock was loose enough to need no update.
- Pending AC #10: HITL manual repro on jalapeno-cheddar-sourdough (or any recipe with experiment block).

## HITL Repro Confirmed (2026-05-17)

User exported on jalapeno-cheddar-sourdough with cheddar 220→275 (+55) and milk-powder 28→35 (+7). Pasted payload contains full experimentExport block: adjustments[] with correct delta values, derivedValues[] (effective-hydration 123%, inclusion-load 71.8%, total-dough 1522g), multiplier 1, scaleMode pre_scaled. Negative cases covered by unit tests AC#7a/b + AC#8.
<!-- SECTION:NOTES:END -->
