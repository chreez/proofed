---
id: PF-252
title: Apply stats predicate to useCost.getVersionAverageCost
status: To Do
assignee: []
created_date: '2026-05-08 01:08'
updated_date: '2026-05-10 04:22'
labels:
  - refactor
  - stats
  - cost
dependencies:
  - PF-246
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-243 spike notes (backlog/tasks/pf-243-spike-notes.md §3.7, table row #28).

src/composables/useCost.ts:122-147 (getVersionAverageCost) computes mean cost across all bakes on the recipe's current major version. It does NOT filter aberrations, in_progress, or (future) excludeFromStats entries. Aberration / experimental bakes inflate the per-version average, which then drives downstream cost displays.

Change:
- :129-134 matching = recipe.cook_log.filter(...) → first apply isCountedInStats(e, recipe.config), then filter major version match.
- Open question: should aberrations also be excluded? Spike recommendation: yes (use isCountedInPrimaryStats) because per-version cost averages are a stats surface. Document in PR.

NOT in scope of this draft:
- getMostRecentCost / getMostRecentCostWithItems / getMostRecentCostDate. These are 'most recent costed bake' helpers, not aggregates. They should NOT filter on stats flags — print page user explicitly selects a source.

Inherits predicate from useStatsFilter.ts (DRAFT-69 precursor). Test: a recipe with aberration cost on the same major version returns the non-aberration average.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/composables/useCost.ts:122-147 getVersionAverageCost function gains an optional recipeConfig?: RecipeConfig | null parameter
- [ ] #2 getVersionAverageCost iteration uses filterCountable(cookLog, recipeConfig) to skip in_progress + excludeFromStats entries before computing the per-major-version mean
- [ ] #3 Aberrations remain INCLUDED in getVersionAverageCost — open spike question resolved as 'aberrations count toward cost averages' (different from groupCounts/calories which exclude them); rationale: cost is a real-world spend metric and aberrations consumed real ingredients. Document decision in task notes.
- [ ] #4 getMostRecentCost / getMostRecentCostWithItems / getMostRecentCostWithItemsDate / getMostRecentCostDate are NOT modified — these helpers are 'most recent costed bake' by definition (per spike §6 edge case table)
- [ ] #5 All call sites of getVersionAverageCost updated to pass recipe.config (audit via grep)
- [ ] #6 useCost.spec.ts gains a test: per-version cost average for a recipe with one excludeFromStats=true entry returns the mean of the OTHER entries (not all 3)
- [ ] #7 useCost.spec.ts gains a test: aberration entry is INCLUDED in getVersionAverageCost mean (regression guard for the design decision above)
- [ ] #8 Existing useCost.spec.ts tests pass without modification
- [ ] #9 Pre/post comparison documented in commit: ba-bolognese version-average cost should change since the 2026-05-06 bake has excludeFromStats=true and currently inflates the average; document new vs old mean
- [ ] #10 npm run build passes
- [ ] #11 Single commit: src/composables/useCost.ts + .spec.ts + any call-site files (e.g. RecipePrintView.vue if it directly calls getVersionAverageCost)
<!-- AC:END -->
