---
id: PF-247
title: Refactor useBakeAggregates to use centralized stats filter
status: To Do
assignee: []
created_date: '2026-05-08 01:06'
updated_date: '2026-05-10 04:21'
labels:
  - refactor
  - stats
dependencies:
  - PF-246
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-243 spike notes (backlog/tasks/pf-243-spike-notes.md §3.1, §8).

Replace the ad-hoc filters in src/composables/useBakeAggregates.ts with the centralized predicate from src/composables/useStatsFilter.ts (isCountedInStats, isCountedInPrimaryStats, filterCountable).

Specific call sites:
- :180 cookLog.filter(e => e.status !== 'in_progress') → filterCountable(cookLog, recipe.config)
- :184 cadence allDates iteration → filterCountable(cookLog, recipe.config)
- :189 lifetimeSpend iteration → filterCountable(cookLog, recipe.config)
- :196 calories normalEntries → cookLog.filter(e => isCountedInPrimaryStats(e, recipe.config))
- :206 group counts → cookLog.filter(e => isCountedInPrimaryStats(e, recipe.config))
- :265-267 computeRecipeAggregates → cookLog.filter(e => isCountedInPrimaryStats(e, recipe.config)).length

Inherits proposed predicate signature from spike notes §4. Tests must verify behavior matches today (zero regression on existing aberration / in_progress cases) AND adds excludeFromStats coverage per PF-240 AC #11-14.

Depends on: a precursor draft to land src/composables/useStatsFilter.ts (the helper itself). PF-240 may consume this work or land it directly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/composables/useBakeAggregates.ts:180 'cookLog.filter(e => e.status !== in_progress)' is replaced with filterCountable(cookLog, recipe.config) (from useStatsFilter)
- [ ] #2 src/composables/useBakeAggregates.ts:184 cadence allDates iteration uses filterCountable(cookLog, recipe.config) — aberrations no longer added to allDates if excludeFromStats is also true; behavior aligns with PF-240 AC #4
- [ ] #3 src/composables/useBakeAggregates.ts:189 lifetimeSpend iteration uses filterCountable(cookLog, recipe.config) — matches PF-240 AC #5
- [ ] #4 src/composables/useBakeAggregates.ts:196 totalCalories accumulator uses cookLog.filter(e => isCountedInPrimaryStats(e, recipe.config)) — preserves existing aberration filter while adding excludeFromStats; matches PF-240 AC #7
- [ ] #5 src/composables/useBakeAggregates.ts:206 groupCounts/typeCounts accumulator uses cookLog.filter(e => isCountedInPrimaryStats(e, recipe.config)) — matches PF-240 AC #6
- [ ] #6 src/composables/useBakeAggregates.ts:265-267 computeRecipeAggregates uses cookLog.filter(e => isCountedInPrimaryStats(e, recipe.config)).length
- [ ] #7 Zero regression: existing useBakeAggregates.spec.ts tests pass without modification (the predicate composes to the same result for current data)
- [ ] #8 useBakeAggregates.spec.ts gains coverage for excludeFromStats interaction with aberration: an aberration+excludeFromStats=true entry is excluded from cadence + spend + calories + groupCounts
- [ ] #9 useBakeAggregates.spec.ts gains coverage for recipeConfig.excludeFromStatsDefault=true with per-bake excludeFromStats=false explicit opt-in
- [ ] #10 Existing PF-240 specs in useBakeAggregates.spec.ts continue to pass — refactor must NOT change behavior for entries that PF-240 already covered
- [ ] #11 npm run build passes; diff-coverage threshold met on changed lines
- [ ] #12 Single commit: src/composables/useBakeAggregates.ts + .spec.ts only; no recipe JSON changes; no other component touched
<!-- AC:END -->
