---
id: DRAFT-124
title: 'Mise list missing butter (50g, stage 2 ingredient)'
status: Draft
assignee: []
created_date: '2026-06-27 22:06'
labels:
  - ungroomed
  - bug
  - ux
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Observed

User bake on 2026-06-27 noted butter (50g, stage 2: Dough Mixing) was missing from the mise list UI. Recipe JSON has it correctly under `stages[1].gather.ingredients`, but the mise component appears to only surface stage 1 (PREP) ingredients.

## Asks

1. Audit which mise component renders the mise list
2. Verify it aggregates ingredients across ALL stages with `gather` blocks, not just stage 0
3. Confirm butter (and similar later-stage inclusions) appear in the rendered mise output

## Source

Bake log 2026-06-27 cook_log entry next_time + scratchpad `_general` note at 11:15am Fri.
<!-- SECTION:DESCRIPTION:END -->
