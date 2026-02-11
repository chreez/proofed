---
id: DRAFT-8
title: Schema spike — StateNote.source field
status: Draft
assignee: []
created_date: '2026-02-11 19:26'
labels:
  - spike
  - schema
dependencies: []
parent_task_id: DRAFT-7
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a `source` field to the `StateNote` type in `src/types/recipe.ts`. Values: `'user' | 'agent'`. This is the data-layer foundation for distinguishing user-authored notes from agent-contributed content (tips, definitions, technique explanations) in recipe JSON.

**Scope (spike — data layer only, no rendering changes):**
- Add `source?: 'user' | 'agent'` to the `StateNote` interface in `recipe.ts`
- Backfill all existing `step_notes` entries in `public/recipes/*.json` with `"source": "user"` (all current notes are user-authored)
- Update any validation checks that touch StateNote shape (checklist.md if needed)
- Document the changelog entry convention: when agent adds notes during a `/feedback` session, the version bump changelog should mention "agent-sourced notes added" or similar
- Verify `npm run build` passes with the type change + backfilled data

**Context for grooming:** This field enables subtask 2 (rendering differentiation) and subtask 3 (the /feedback skill that writes agent-sourced notes). The schema change must land first so downstream work has something to key off of.
<!-- SECTION:DESCRIPTION:END -->
