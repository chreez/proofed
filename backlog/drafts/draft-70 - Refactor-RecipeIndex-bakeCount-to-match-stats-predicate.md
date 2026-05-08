---
id: DRAFT-70
title: Refactor RecipeIndex bakeCount to match stats predicate
status: Draft
assignee: []
created_date: '2026-05-08 01:07'
labels:
  - refactor
  - stats
  - ui
dependencies: []
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
