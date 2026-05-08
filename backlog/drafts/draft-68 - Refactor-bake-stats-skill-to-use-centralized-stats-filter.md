---
id: DRAFT-68
title: Refactor bake-stats skill to use centralized stats filter
status: Draft
assignee: []
created_date: '2026-05-08 01:07'
labels:
  - refactor
  - stats
  - skill
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-243 spike notes (backlog/tasks/pf-243-spike-notes.md §3.8, table §2 rows #34-36).

scripts/bake-stats.ts currently:
- :209 sets bake_count = log.length (counts aberrations + in_progress)
- :214 sets total_bakes += log.length (same drift)
- :218-219 collects every entry's date for date_range (includes excluded entries)
- :231 reports aberrations as a separate count (correct), but rolls them into bake_count

Replace with:
- bake_count = filterCountable(log, recipe.config).length (or the stricter isCountedInPrimaryStats variant — open question, see SKILL.md update)
- aberrations stays as-is (separate field)
- total_bakes uses the same predicate
- date_range either filters via filterCountable OR documents the inclusive semantic

Per PF-240 AC #8: 'output JSON either omits them from rolled-up counts OR exposes them under a separate excluded field — chosen approach documented in SKILL.md.' Pick one and document in .claude/skills/bake-stats/SKILL.md.

Note: scripts/ is plain Node + tsx. Pure helpers in src/composables/useStatsFilter.ts must stay pure (no Vue reactivity) so they can be imported here. Verified in spike §5.

Depends on: precursor draft to land useStatsFilter.ts.
<!-- SECTION:DESCRIPTION:END -->
