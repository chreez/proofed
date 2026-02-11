---
id: PF-118
title: 'Recipe Feedback Skill — schema support, skill, and UI'
status: To Do
assignee: []
created_date: '2026-02-11 19:26'
updated_date: '2026-02-11 19:39'
labels:
  - feature
  - skill
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A `/feedback` skill for interactive recipe review sessions. User picks a recipe, reads through it, asks questions, flags changes, and makes notes. Agent always checks the recipe JSON first before offering external knowledge. Agentic inferences (tips, definitions, technique explanations) are labeled with their source and persisted as StateNote entries. Changes happen live on localhost during the session. Session concludes with a version bump and changelog entry. All agent-contributed content remains distinguishable from user-authored content in the schema and on the site.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `/feedback` skill exists at `.claude/skills/feedback/SKILL.md` and is registered as user-invocable
- [ ] #2 Skill accepts a recipe ID (or prompts for selection) and loads the recipe JSON as primary source of truth before answering any questions
- [ ] #3 Agent answers from recipe JSON first; external knowledge is always labeled with provenance (source name/URL)
- [ ] #4 User can accept or dismiss each agent-contributed note during the session — accepted notes persist as `StateNote` with `source: 'agent'`, dismissed notes are discarded
- [ ] #5 `StateNote` interface includes `source?: 'user' | 'agent'` field; all pre-existing notes backfilled with `source: 'user'`
- [ ] #6 Agent-sourced notes render visually distinct from user-authored notes on the recipe page (design chosen via demo spike)
- [ ] #7 Session concludes with a version bump proposal (user must explicitly confirm) and a `change_log` entry summarizing additions
- [ ] #8 No `CookLogEntry` is created for feedback sessions — cook log remains bakes only
- [ ] #9 Agent follows Cook Log Protocol scribe principles for user input: no embellishment, no inferred details, clarify before recording
- [ ] #10 `npm run build` passes with all schema changes, backfilled data, and any new/updated components
<!-- AC:END -->
