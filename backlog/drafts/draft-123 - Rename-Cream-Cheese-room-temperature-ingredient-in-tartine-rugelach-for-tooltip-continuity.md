---
id: DRAFT-123
title: >-
  Rename Cream Cheese room temperature ingredient in tartine-rugelach for
  tooltip continuity
status: Draft
assignee: []
created_date: '2026-07-04 20:35'
labels:
  - ungroomed
  - recipe
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Source

PF-283 spike POC identified one remaining data mismatch after word-boundary matching lands:

Current: `Cream Cheese (room temperature)` in `tartine-rugelach.json` matches `room temp` today (subset). Under word-boundary rules the match disappears — regressing to no tooltip on cream cheese.

## Change

Rename ingredient in `stages[0].gather.ingredients` (id `cream-cheese`) from `Cream Cheese (room temperature)` to `Cream Cheese (softened)` so it matches the existing `softened` technique key which correctly covers cream cheese ("Softened Butter/Cream Cheese").

Also rename `Unsalted Butter (room temperature)` (id `unsalted-butter`) to `Unsalted Butter (softened)` for consistency + correct tooltip.

## Acceptance Criteria

1. Rugelach `stages[0].gather.ingredients` for `cream-cheese` id has `name: "Cream Cheese (softened)"`
2. Rugelach `stages[0].gather.ingredients` for `unsalted-butter` id has `name: "Unsalted Butter (softened)"`
3. Recipe `version` bumped to next patch (`v?.?.1` or similar based on current)
4. New `change_log` entry with frozen snapshot reflecting renamed ingredients
5. Historical `change_log[]` + `cook_log[]` snapshots untouched (freeze rule)
6. `npm run build` passes
7. Visual HITL on `/recipe/tartine-rugelach` — cream cheese and butter both show correct softened-tooltip

## Blocked by

Word-boundary matcher change (draft above) must land first — otherwise the rename would incorrectly still trigger tooltip via subset match on old keyword
<!-- SECTION:DESCRIPTION:END -->
