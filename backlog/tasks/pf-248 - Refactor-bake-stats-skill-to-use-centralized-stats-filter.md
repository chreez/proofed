---
id: PF-248
title: Refactor bake-stats skill to use centralized stats filter
status: To Do
assignee: []
created_date: '2026-05-08 01:07'
updated_date: '2026-05-10 04:21'
labels:
  - refactor
  - stats
  - skill
dependencies:
  - PF-246
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 scripts/bake-stats.ts imports isCountedInStats / filterCountable from src/composables/useStatsFilter (Node-compatible per DRAFT-69)
- [ ] #2 scripts/bake-stats.ts:209 bake_count uses filterCountable(log, recipe.config).length instead of log.length
- [ ] #3 scripts/bake-stats.ts:214 total_bakes accumulator uses filterCountable(log, recipe.config).length
- [ ] #4 scripts/bake-stats.ts:255-279 cost rollups (recipeTotalSpent, bakesWithCost, totalCostSpent) iterate over filterCountable(log, recipe.config) instead of all entries
- [ ] #5 scripts/bake-stats.ts:308-320 global dates collection uses filterCountable to exclude in_progress + excludeFromStats entries from date_range
- [ ] #6 Per-recipe excluded_bakes field is added to the snapshot output: count of entries where isCountedInStats returns false (aligns with PF-240 AC #8 'omit-and-surface' decision documented in .claude/skills/bake-stats/SKILL.md)
- [ ] #7 .claude/skills/bake-stats/SKILL.md updated: documents that bake_count / total_bakes now respect isCountedInStats; aberrations stay reported separately as before; new excluded_bakes field documented
- [ ] #8 Aberrations retain their dedicated reporting (current behavior) — refactor does not merge aberration into the new stats filter
- [ ] #9 Existing bake-stats output schema is backward compatible: existing fields keep their meaning (bake_count just no longer double-counts excluded entries); excluded_bakes is new optional field
- [ ] #10 Manual verification: run scripts/bake-stats.ts on the current public/recipes/ tree pre/post refactor; document any per-recipe count changes in the commit message (expected: ba-bolognese excluded_bakes goes from 0 to 1 because the 2026-05-06 entry has excludeFromStats=true)
- [ ] #11 npm run build passes
- [ ] #12 Single commit: scripts/bake-stats.ts + .claude/skills/bake-stats/SKILL.md only; no other files touched
<!-- AC:END -->
