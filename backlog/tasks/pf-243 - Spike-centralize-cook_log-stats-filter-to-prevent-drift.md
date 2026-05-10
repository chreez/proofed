---
id: PF-243
title: 'Spike: centralize cook_log stats filter to prevent drift'
status: Done
assignee: []
created_date: '2026-05-07 18:44'
updated_date: '2026-05-08 01:01'
labels:
  - spike
  - stats
  - refactor
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Source

Captured during DRAFT-71 grooming (2026-05-07). When evaluating excludeFromStats, surfaced inconsistency in existing aberration filtering: aberration excludes calories + group counts but NOT cadence dates or lifetime spend (`useBakeAggregates.ts:182-190`). User flagged code smell: "wondering if this stuff is all calculated in one place so we can't miss these cases."

## Problem

Stats roll-up logic is scattered. There is no single predicate for "should this cook_log entry count toward stats?" Every consumer reimplements its own filter (`!aberration` here, no filter there, possibly `!excludeFromStats` once that lands). New stats surfaces inevitably miss one of the flags.

## Goals (for spike)

1. Enumerate every stats consumer that reads cook_log:
   - useBakeAggregates.ts (lifetime cadence, spend, calories, group counts)
   - bake-stats skill JSON snapshot
   - useCost.ts cost roll-ups (if any)
   - useCookLog hero photo selection (already aberration-aware)
   - StatsPage.vue and any other stats-y components
   - Anywhere reading `recipe.cook_log[]` for aggregate purposes
2. For each consumer, document which flags it currently respects (aberration? excludeFromStats? status: in_progress?).
3. Propose a centralized predicate or filter helper, e.g.:
   - `isCountedInStats(entry, recipeConfig?): boolean`
   - or `filterCountable(entries, recipeConfig?): CookLogEntry[]`
4. Recommend whether the helper lives in a new composable (e.g. `useStatsFilter.ts`), inline on the Recipe type, or as a pure util in `src/utils/`.
5. Note edge cases:
   - status: 'in_progress' should presumably NOT count anywhere (currently filtered ad-hoc)
   - aberration semantics may diverge from excludeFromStats (DRAFT-71 keeps them separate)
   - recipe.config.excludeFromStatsDefault interacts at write-time (cook_log entry creation), not read-time

## Output

Write findings into the spike's notes file. Translate findings into:
- 1+ Draft tasks per actionable refactor (e.g. "Refactor useBakeAggregates to use isCountedInStats")
- A recommended call site list for the new helper

## Out of scope

- Implementation. Spike is research-only. Draft tasks created from findings get groomed and implemented separately.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spike findings written to backlog/tasks/pf-243-spike-notes.md (or equivalent file referenced from the task)
- [ ] #2 Findings include a complete consumer inventory: a table listing every file/function in the codebase that reads recipe.cook_log[] for aggregate or filtered purposes, with file path + line number + brief description of what it computes
- [ ] #3 Inventory MUST cover at minimum: useBakeAggregates.ts (cadence/spend/calories/groupCounts), .claude/skills/bake-stats/, useCost.ts, useCookLog.ts (hero photo path), StatsPage.vue, RecipeIndex.vue (in-progress detection), RecipeMeta.vue (bake counts), BakeDetailView.vue, and any other component reading cook_log for aggregate purposes — grep verifies completeness
- [ ] #4 For each consumer, findings document which flags it currently respects with a flag matrix: { aberration, excludeFromStats, status: 'in_progress', other? } → ✓/✗
- [ ] #5 Findings call out every divergence (e.g. useBakeAggregates.ts:182-190 cadence ignores aberration but calories filter respects it) with file path + line number
- [ ] #6 Findings recommend a single centralized predicate signature, e.g. isCountedInStats(entry: CookLogEntry, recipeConfig?: RecipeConfig): boolean — with explicit treatment of in-progress, aberration, excludeFromStats, and recipe.config.excludeFromStatsDefault
- [ ] #7 Findings recommend a location for the helper (new composable src/composables/useStatsFilter.ts, pure util src/utils/statsFilter.ts, or method on a Recipe class) with rationale
- [ ] #8 Findings document edge cases: in_progress entries (currently filtered ad-hoc), recipe-level excludeFromStatsDefault (write-time vs read-time), and any cases where the predicate should NOT apply (e.g. hero photo skips aberrations but considers in_progress separately)
- [ ] #9 Findings recommend whether existing aberration filter should be merged into the centralized predicate OR remain as a separate concern (per DRAFT-71/PF-240's decision that flags are independent)
- [ ] #10 ≥1 follow-up Draft task created per actionable refactor; minimum drafts: 'Refactor useBakeAggregates to use centralized stats filter' and 'Refactor bake-stats skill to use centralized stats filter'; additional drafts created for any consumer that diverges from the recommendation
- [ ] #11 Each follow-up Draft references the spike notes as source and inherits the proposed predicate signature
- [ ] #12 Spike completion gate met (per .claude/rules/grooming.md): research notes exist, architecture decision documented, ≥1 draft per finding, user has reviewed findings — agent does NOT self-close the spike
- [ ] #13 No code changes in this task; no source files in src/ are modified; only the spike notes file and new Draft tasks are produced
- [ ] #14 Spike notes are concrete enough to grade: every recommendation includes a file path, function signature, or specific line; vague guidance ('consider centralizing') fails the gate
<!-- AC:END -->
