---
id: DRAFT-73
title: Apply stats predicate to useCost.getVersionAverageCost
status: Draft
assignee: []
created_date: '2026-05-08 01:08'
labels:
  - refactor
  - stats
  - cost
dependencies: []
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
