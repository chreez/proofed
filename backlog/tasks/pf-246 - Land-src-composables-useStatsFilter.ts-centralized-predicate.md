---
id: PF-246
title: Land src/composables/useStatsFilter.ts (centralized predicate)
status: To Do
assignee: []
created_date: '2026-05-08 01:07'
updated_date: '2026-05-10 04:20'
labels:
  - refactor
  - stats
  - foundation
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-243 spike notes (backlog/tasks/pf-243-spike-notes.md §4-§5).

Precursor task: create the helper module before any consumer migration.

File: src/composables/useStatsFilter.ts (pure functions only, no Vue reactivity, so scripts/bake-stats.ts can import).

Exports (from spike §4):
- isCountedInStats(entry: CookLogEntry, recipeConfig?: RecipeConfig | null): boolean
- isCountedInPrimaryStats(entry, recipeConfig): boolean (composes !aberration with isCountedInStats)
- filterCountable(entries, recipeConfig): CookLogEntry[]

Rules (evaluation order, early-return false on first hit):
1. status === 'in_progress' → false
2. excludeFromStats === true → false
3. recipeConfig?.excludeFromStatsDefault === true AND excludeFromStats !== false → false
4. otherwise true

Aberration NOT consulted in isCountedInStats (per DRAFT-71 / PF-240 AC #3 'flags are independent'). Aberration filter stays separate; isCountedInPrimaryStats provides the common composition.

Tests: src/composables/useStatsFilter.spec.ts covering the truth table in spike §9.

Note: depends on PF-240 to land the schema fields (cook_log[].excludeFromStats, recipe.config.excludeFromStatsDefault) on the CookLogEntry / RecipeConfig types. Until PF-240 lands those, this draft can ship with optional-property handling that simply treats undefined as false (rule 4 wins), but the type updates from PF-240 AC #3 unlock rules 2-3 with type safety.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 New file src/composables/useStatsFilter.ts exports three pure functions: isCountedInStats(entry, recipeConfig?), isCountedInPrimaryStats(entry, recipeConfig?), filterCountable(entries, recipeConfig?)
- [ ] #2 All exports are pure functions — no ref/computed/watch/Vue imports; importable from Node context (scripts/bake-stats.ts)
- [ ] #3 isCountedInStats evaluates four rules in order with early-return false: (1) entry.status === 'in_progress' → false, (2) entry.excludeFromStats === true → false, (3) recipeConfig?.excludeFromStatsDefault === true AND entry.excludeFromStats !== false → false, (4) otherwise → true
- [ ] #4 isCountedInStats does NOT consult entry.aberration — flags are independent per PF-240 AC #3 / DRAFT-71
- [ ] #5 isCountedInPrimaryStats returns isCountedInStats(entry, recipeConfig) && !entry.aberration — codifies the common composition for calorie/group-count/recipeBakeCount surfaces
- [ ] #6 filterCountable(entries, recipeConfig) returns entries.filter(e => isCountedInStats(e, recipeConfig)); handles undefined/null entries by returning []
- [ ] #7 JSDoc on each export documents rule order, cites PF-240/DRAFT-71, and explains why aberration is composed separately
- [ ] #8 New test file src/composables/useStatsFilter.spec.ts covers the truth table in spike notes §9: 7 rows × {isCountedInStats, isCountedInPrimaryStats}
- [ ] #9 Tests cover the rule-3 edge case where entry.excludeFromStats === false explicitly opts back IN despite recipeConfig.excludeFromStatsDefault === true
- [ ] #10 Tests cover undefined/null entries[] passed to filterCountable returning []
- [ ] #11 No consumer migration in this PR — diff is limited to the new file + spec; src/composables/useBakeAggregates.ts, src/components/StatsPage.vue, scripts/bake-stats.ts etc. are NOT modified (those land in DRAFT-67/68/70-73)
- [ ] #12 npm run build passes; diff-coverage on the new file ≥90% lines, ≥80% branches
- [ ] #13 Backlog task notes get a follow-up reference linking PF-247..252 (the 6 dependent refactor tasks once DRAFT-67/68/70-73 are groomed)
<!-- AC:END -->
