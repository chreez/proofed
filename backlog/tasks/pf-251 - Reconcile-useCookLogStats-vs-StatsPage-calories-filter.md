---
id: PF-251
title: Reconcile useCookLogStats vs StatsPage calories filter
status: To Do
assignee: []
created_date: '2026-05-08 01:07'
updated_date: '2026-05-10 04:22'
labels:
  - refactor
  - stats
  - bug
dependencies:
  - PF-246
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/composables/useCookLogStats.ts function signatures gain an optional recipeConfig?: RecipeConfig | null parameter on completedBakes, sessionCount, itemsCreated, servingsCreated, caloriesCreated
- [ ] #2 completedBakes(recipe, recipeConfig?) uses isCountedInStats(e, recipeConfig) — replaces the current 'e.status !== in_progress' inline filter
- [ ] #3 caloriesCreated(recipe, recipeConfig?) uses isCountedInPrimaryStats(e, recipeConfig) — picks up aberration filter; aligns with StatsPage.allCalories and useBakeAggregates.totalCalories per spike §3.2
- [ ] #4 itemsCreated(recipe, recipeConfig?) and servingsCreated(recipe, recipeConfig?) use isCountedInStats(e, recipeConfig) — keep aberrations counted (open question per spike noted divergence) UNLESS task notes document a different decision before implementation
- [ ] #5 sessionCount(recipe, recipeConfig?) uses filterCountable(...).length
- [ ] #6 src/components/CookLogSection.vue updates 4-5 call sites (lines 36-41) to pass recipe.config to the new signatures
- [ ] #7 useCookLogStats.spec.ts coverage: aberration entry contributes to itemsCreated/servingsCreated but NOT caloriesCreated (matches new policy); excludeFromStats=true entry contributes to NOTHING; in_progress entry contributes to NOTHING
- [ ] #8 CookLogSection.spec.ts coverage: header stats row for a recipe with mixed entry types renders consistent numbers with the dashboard (no more drift between per-recipe header and lifetime aggregate)
- [ ] #9 Pre/post numeric audit documented in commit message: list 2-3 recipes whose CookLogSection header calories changed (specifically: jalapeno-cheddar-sourdough should drop the calories from any aberration bake)
- [ ] #10 Open question explicitly resolved before implementation: should itemsCreated/servingsCreated count aberrations? Spike says no by default (keep simple) but recipe-page header semantically might want to. Task notes document the decision.
- [ ] #11 npm run build passes
- [ ] #12 Single commit: src/composables/useCookLogStats.ts + .spec.ts + src/components/CookLogSection.vue + .spec.ts
<!-- AC:END -->
