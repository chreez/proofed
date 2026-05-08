---
id: DRAFT-67
title: Refactor useBakeAggregates to use centralized stats filter
status: Draft
assignee: []
created_date: '2026-05-08 01:06'
labels:
  - refactor
  - stats
dependencies: []
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
