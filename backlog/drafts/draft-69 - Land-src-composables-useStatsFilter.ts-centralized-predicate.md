---
id: DRAFT-69
title: Land src/composables/useStatsFilter.ts (centralized predicate)
status: Draft
assignee: []
created_date: '2026-05-08 01:07'
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
