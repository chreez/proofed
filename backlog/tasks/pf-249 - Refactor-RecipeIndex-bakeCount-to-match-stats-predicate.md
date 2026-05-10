---
id: PF-249
title: Refactor RecipeIndex bakeCount to match stats predicate
status: To Do
assignee: []
created_date: '2026-05-08 01:07'
updated_date: '2026-05-10 04:21'
labels:
  - refactor
  - stats
  - ui
dependencies:
  - PF-246
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-243 spike notes (backlog/tasks/pf-243-spike-notes.md §3.4, table row #20).

src/components/RecipeIndex.vue:108-122 currently sets bakeCount = cookLog.length, which counts aberrations AND in_progress entries. This is the highest-friction visible mismatch on the site: index card pill disagrees with both the IG share caption (BakeDetailView 'Bake #N of …') and the StatsPage dashboard.

Change:
- :122 bakeCount: cookLog.length → bakeCount: cookLog.filter(e => isCountedInPrimaryStats(e, data.config)).length

Open question (call out in PR): does 'baked' (line :109 hasCookLog) flip on for an in_progress-only or aberration-only recipe? Spike recommendation: baked stays generous (any cook_log row, including in_progress, marks a recipe as touched), but bakeCount is strict. Document the split in component comment.

Inherits predicate from useStatsFilter.ts (DRAFT-69 precursor). Test added to src/components/RecipeIndex.spec.ts to assert mixed cook_log produces a strict bakeCount.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/components/RecipeIndex.vue:108-122 fetchRecipeMeta replaces 'bakeCount: cookLog.length' with bakeCount: cookLog.filter(e => isCountedInPrimaryStats(e, recipeJson.config)).length
- [ ] #2 Result: index card 'X bakes' pill matches the IG caption 'Bake #N of …' (computeRecipeAggregates) and the dashboard totalBakes — resolves spike §3.4 highest-friction visible mismatch
- [ ] #3 hasCookLog computation also filters via isCountedInStats so a recipe with ONLY in_progress or excludeFromStats entries does not flip from 'unbaked' to 'baked' on the index
- [ ] #4 Pre/post counts documented in commit message for at least 3 affected recipes (e.g. ba-bolognese went from 1 to 0 visible bakes due to excludeFromStats; ATK cinnamon buns + jalapeno-cheddar should be unchanged)
- [ ] #5 src/components/RecipeIndex.spec.ts gains a regression test: fixture recipe with one in_progress + one aberration + one normal entry — bakeCount returns 1 (only the normal counts under isCountedInPrimaryStats)
- [ ] #6 Existing RecipeIndex tests pass without modification (refactor preserves visible behavior except where drift was the bug)
- [ ] #7 npm run build passes
- [ ] #8 Single commit: src/components/RecipeIndex.vue + .spec.ts only; no other files touched
- [ ] #9 HITL styling gate not required: this is a count-fix, the visual layout of the pill is unchanged. Confirm pre/post screenshot of /index page shows only the count number changed (commit message includes this confirmation)
<!-- AC:END -->
