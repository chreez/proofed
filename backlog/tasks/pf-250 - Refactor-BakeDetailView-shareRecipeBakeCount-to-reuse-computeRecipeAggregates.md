---
id: PF-250
title: Refactor BakeDetailView shareRecipeBakeCount to reuse computeRecipeAggregates
status: To Do
assignee: []
created_date: '2026-05-08 01:07'
updated_date: '2026-05-10 04:22'
labels:
  - refactor
  - stats
  - share
dependencies:
  - PF-246
  - PF-247
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-243 spike notes (backlog/tasks/pf-243-spike-notes.md §3.5, table row #21).

src/components/BakeDetailView.vue:97-101 inlines:
  cookLog.filter(e => e.status !== 'in_progress' && !e.aberration).length

useBakeAggregates already exports computeRecipeAggregates(recipe) (src/composables/useBakeAggregates.ts:262-269) which returns the same value as { recipeBakeCount }. Replace inline filter with a call to computeRecipeAggregates(currentRecipe.value).recipeBakeCount.

After DRAFT-67 lands, computeRecipeAggregates itself will be using the centralized predicate, so this PR transitively gains stats correctness for free.

Inherits predicate signature from spike §4. Test in src/App.spec.ts (or a new BakeDetailView spec) verifies the IG caption renders 'Bake #N of …' with N matching computeRecipeAggregates output.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/components/BakeDetailView.vue:97-101 inline 'cookLog.filter(e => e.status !== in_progress && !e.aberration).length' is replaced with computeRecipeAggregates(currentRecipe.value).recipeBakeCount
- [ ] #2 Inline filter is removed — single source of truth becomes useBakeAggregates.computeRecipeAggregates (which itself uses isCountedInPrimaryStats per PF-247)
- [ ] #3 shareRecipeBakeCount continues to drive the IG caption 'Bake #N of …' with identical numeric output for current data
- [ ] #4 Test: snapshot/component test on BakeDetailView verifies caption number matches a fixture's computeRecipeAggregates result with a mix of normal + aberration + in_progress + excludeFromStats entries
- [ ] #5 Refactor must NOT change the visual caption format — only the source of the count
- [ ] #6 BakeDetailView.spec.ts (existing) passes without modification
- [ ] #7 npm run build passes
- [ ] #8 Single commit: src/components/BakeDetailView.vue + .spec.ts only
- [ ] #9 Hard dependency on PF-247 (which makes computeRecipeAggregates use isCountedInPrimaryStats); without PF-247, this refactor still works but does not pick up excludeFromStats coverage
<!-- AC:END -->
