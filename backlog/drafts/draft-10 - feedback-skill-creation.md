---
id: DRAFT-10
title: /feedback skill creation
status: Draft
assignee: []
created_date: '2026-02-11 19:27'
labels:
  - feature
  - skill
dependencies:
  - DRAFT-8
  - DRAFT-9
parent_task_id: DRAFT-7
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a new skill at `.claude/skills/feedback/SKILL.md` that drives interactive recipe review sessions. This is the main deliverable of the parent task.

**Skill flow:**
1. **Recipe selection** — ask which recipe (or accept as argument), load its JSON from `public/recipes/`
2. **Recipe JSON as source of truth** — agent reads the full recipe before answering any questions. Recipe data is the primary authority; external knowledge is secondary and always labeled
3. **Interactive review loop** — user reads through the recipe and reacts:
   - Questions ("what does autolyse do?") → agent answers from recipe context first, cites external sources if needed
   - Notes ("the dough was really sticky last time") → captured as `StateNote` with `source: 'user'`
   - Flags ("this temperature seems wrong") → agent checks recipe JSON, proposes fix if warranted
   - Agent inferences (tips, technique definitions, sourced suggestions) → persisted as `StateNote` with `source: 'agent'`, labeled with provenance
4. **Live changes** — edits to recipe JSON happen during the session, visible on localhost
5. **Session conclusion** — agent proposes a version bump (user confirms), writes changelog entry summarizing what changed, all `StateNote` additions tagged with `source: 'agent'`

**Key principles (reference Cook Log Protocol in CLAUDE.md):**
- Agent is a scribe for user input — never embellish or infer unstated details
- Agent-contributed content is always distinguishable: `source: 'agent'` in data, visual differentiation in UI (per DRAFT-9 outcome)
- Recipe JSON is checked before any external knowledge is offered
- Version bump requires explicit user confirmation

**Dependencies:** DRAFT-8 (schema — `source` field must exist) and DRAFT-9 (demo — rendering direction must be chosen). Cannot start until both are complete.

**Context for grooming:** This is a skill file, not application code. The skill orchestrates agent behavior during a `/feedback` session. Implementation may also need minor component updates to render `source: 'agent'` notes per the chosen design from DRAFT-9.
<!-- SECTION:DESCRIPTION:END -->
