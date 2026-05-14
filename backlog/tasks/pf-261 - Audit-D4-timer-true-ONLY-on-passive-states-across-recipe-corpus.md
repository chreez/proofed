---
id: PF-261
title: 'Audit D4 (timer:true ONLY on passive states) across recipe corpus'
status: In Progress
assignee: []
created_date: '2026-05-12 13:11'
updated_date: '2026-05-14 19:36'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255.3 spike §6. ny-style-pizza.json has COLD_BULK_FERMENT (720 min) and COLD_PROOF (2880 min) with timer:false despite both being multi-hour passive cold rests. Per CLAUDE.md rule D4 ('timer: true ONLY on passive states like rise, bake, cool'), these SHOULD have timer:true. Either the JSON is wrong (fix it) or the rule's intent excludes overnight cold rests (revise CLAUDE.md). Audit all 26 recipes for similar violations. Pick the canonical interpretation, fix divergent recipes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All 26 recipes in public/recipes/*.json walked through stages[].states[] and audited against D4.
- [ ] #2 Audit table (recipe | stage | state_id | title | current_timer | should_be | reasoning) documented in backlog/tasks/pf-261-d4-audit-notes.md.
- [ ] #3 Confirmed D4 violations have timer flipped to the correct value.
- [ ] #4 Each modified recipe JSON receives a minor version bump and a change_log[] entry summarizing the D4 fix, with ingredients snapshot preserved (cloned from gather state per PF-237).
- [ ] #5 scripts/sync-ingredient-snapshots.ts runs idempotently with no diff after fixes.
- [ ] #6 npm run build passes (BV1-BV3, including D4 validation test).
- [ ] #7 Status set to In Progress; task file staged with code changes (not committed).
<!-- AC:END -->
