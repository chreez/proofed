---
id: DRAFT-66
title: 'Fix bake-log skill: curated field guidance too permissive'
status: Draft
assignee: []
created_date: '2026-04-29 00:47'
labels:
  - bug
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The bake-log skill says 'curated: agent-refined version when meaningfully different from raw (omit if same)' — agents interpret this too liberally and skip curation on messy voice-memo text. Result: BakeDetailView falls back to raw text on most bake_notes entries.

## Root Cause
Skill definition in .claude/skills/bake-log/bake-log.md, Phase 2 'Preserve Raw Input as BakeNote[]' section.

## Fix
1. Change curated guidance from 'omit if same' to 'always populate unless raw is already clean'
2. Add explicit curation rules: fix capitalization, expand abbreviations, format units, clean grammar, remove profanity — never add unstated information
3. Strengthen proof_phases guidance: always compute duration_min when start times are known
4. Add Stats Gap Detection enforcement for proof duration back-calculation

## Acceptance Criteria
- [ ] curated field spec says 'always populate unless raw is already clean, properly capitalized prose with correct unit formatting'
- [ ] Explicit curation rules listed in skill (capitalization, abbreviations, units, grammar, profanity)
- [ ] Curation rules state 'never add unstated information, never change user voice beyond cleanup'
- [ ] proof_phases guidance requires computed duration_min when timestamps available
- [ ] Echo Check table in Phase 3 shows curated column populated for all entries needing cleanup
- [ ] Stats Gap Detection section includes proof duration back-calculation from bake-out time
<!-- SECTION:DESCRIPTION:END -->
