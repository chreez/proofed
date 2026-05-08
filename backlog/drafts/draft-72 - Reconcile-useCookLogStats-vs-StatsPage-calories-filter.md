---
id: DRAFT-72
title: Reconcile useCookLogStats vs StatsPage calories filter
status: Draft
assignee: []
created_date: '2026-05-08 01:07'
labels:
  - refactor
  - stats
  - bug
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-243 spike notes (backlog/tasks/pf-243-spike-notes.md §3.2, table rows #16-17 vs #9, #3).

DRIFT: src/composables/useCookLogStats.ts:53-60 (caloriesCreated) does NOT filter aberrations, but both src/components/StatsPage.vue:335-346 (allCalories) and src/composables/useBakeAggregates.ts:196-201 (totalCalories) DO filter aberrations.

Effect: a recipe with one aberration shows non-zero calories in src/components/CookLogSection.vue:41 (per-recipe header row) but contributes zero to the dashboard lifetime total. Inconsistent UX.

Decision needed (call out in PR):
A) caloriesCreated SHOULD filter aberrations (matches dashboard) → update useCookLogStats to apply isCountedInPrimaryStats
B) caloriesCreated SHOULD NOT filter aberrations (per-recipe header is teaching context) → document the divergence in code comments and StatsPage

Spike recommendation: option A. Per-recipe header should agree with the dashboard. Aberrations have caloriesPerServing: null in StatsPage anyway (forced at :186), so the empirical effect of filtering them is just consistency with the dashboard's behavior.

After DRAFT-69 lands isCountedInPrimaryStats:
- :19-22 completedBakes signature gains optional recipe param
- :53-60 caloriesCreated uses isCountedInPrimaryStats(e, recipe.config)
- existing CookLogSection callers (4-5 sites) update to pass recipe through (already a prop)

Test added: caloriesCreated returns 0 for a recipe whose only completed entry is an aberration.
<!-- SECTION:DESCRIPTION:END -->
