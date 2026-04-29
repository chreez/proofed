---
id: DRAFT-67
title: Backfill curated fields on all existing bake_notes entries
status: Draft
assignee: []
created_date: '2026-04-29 00:47'
labels:
  - bug
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
3 of 5 recipes with bake_notes have zero curated fields. Even the 2 that do have some are incomplete. The bake detail page falls back to raw voice-memo text when curated is missing.

## Scope
Affected recipes (from audit):
- sourdough-pizza-dough (2026-04-11): 0 curated
- atk-cinnamon-buns-ultimate (2026-04-25): 0 curated
- simple-sourdough-wheat (2026-04-21): 0 curated
- simple-sourdough (2026-04-24): partial curated
- gochujang-garlic-buns (2026-04-22): partial curated

simple-sourdough 2026-04-28 already fixed.

## Blocked By
DRAFT-66 (skill fix) — need finalized curation rules before backfilling to ensure consistency.

## Acceptance Criteria
- [ ] Every bake_notes entry across all recipes has curated field populated (unless raw is already clean prose)
- [ ] Curated text follows rules from DRAFT-66: capitalization, units, abbreviations, grammar
- [ ] proof_phases duration_min computed on all entries with available timestamps
- [ ] No curated field adds information the user didn't state
- [ ] Build passes after all changes
<!-- SECTION:DESCRIPTION:END -->
