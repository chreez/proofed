---
id: PF-228
title: 'Fix bake-log skill: curated field guidance too permissive'
status: Done
assignee: []
created_date: '2026-04-29 00:47'
updated_date: '2026-04-29 00:58'
labels:
  - bug
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Description

The bake-log skill says 'curated: agent-refined version when meaningfully different from raw (omit if same)' — agents interpret this too liberally and skip curation on messy voice-memo text. Result: BakeDetailView falls back to raw text on most bake_notes entries.

## Root Cause
Skill definition in .claude/skills/bake-log/skill.md, Phase 2 'Preserve Raw Input as BakeNote[]' section.

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 curated field spec says 'always populate unless raw is already clean, properly capitalized prose with correct unit formatting'
- [ ] #2 Explicit curation rules listed in skill (capitalization, abbreviations, units, grammar, profanity)
- [ ] #3 Curation rules state 'never add unstated information, never change user voice beyond cleanup'
- [ ] #4 proof_phases guidance requires computed duration_min when timestamps available
- [ ] #5 Echo Check table in Phase 3 shows curated column populated for all entries needing cleanup
- [ ] #6 Stats Gap Detection section includes proof duration back-calculation from bake-out time
<!-- SECTION:DESCRIPTION:END -->
<!-- AC:END -->
