---
id: DRAFT-71
title: Refactor BakeDetailView shareRecipeBakeCount to reuse computeRecipeAggregates
status: Draft
assignee: []
created_date: '2026-05-08 01:07'
labels:
  - refactor
  - stats
  - share
dependencies: []
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
