---
id: PF-118
title: 'Recipe Feedback Skill — schema support, skill, and UI'
status: To Do
assignee: []
created_date: '2026-02-11 19:26'
updated_date: '2026-02-11 19:55'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## CookLogEntry.step_notes Investigation (PF-118.1 Spike)

**Current shape:** `step_notes?: Record<string, string>` — flat map of state ID → single string.

**Finding:** No restructuring needed. Rationale:
- PF-118 AC#8 explicitly states no `CookLogEntry` is created for feedback sessions — cook log remains bakes only
- Cook log step_notes are always user-authored (bake observations), never agent-contributed
- The `source` attribution is only relevant for `RecipeState.notes[]` (StateNote), where the /feedback skill writes agent-sourced tips
- Adding `source` to step_notes would mean changing `Record<string, string>` to `Record<string, StateNote>` which is a breaking migration for no functional gain

**Recommendation:** Leave `CookLogEntry.step_notes` as `Record<string, string>`. If a future feature needs agent attribution in cook logs, it can be addressed then.

## Changelog Convention for Feedback Sessions

When a `/feedback` session concludes with a version bump, the `change_log` entry should:
- Summary format: `"Added agent-sourced notes: {list of state IDs}"` e.g. `"Added agent-sourced technique notes to RISE_1, ADD_BUTTER"`
- If user also made changes: `"Feedback session: updated directions for MIX_DRY; added agent-sourced notes to RISE_1, ADD_BUTTER"`
- Always distinguish user changes from agent additions in the summary

## Design Decision: Agent Note Rendering (PF-118.2 Outcome)

**Chosen: Option A — Monospace Label**
- Agent notes get a `// Agent Tip` label above the text, mirroring the `// My Note` cook log pattern
- Keeps the developer-comment visual language consistent

**Critical rule: Yellow is user-only**
- The accent-tint/yellow critical styling (`bg-accent-tint text-accent border-l-4 border-accent`) is reserved exclusively for user-authored callouts
- Agent notes NEVER get critical/yellow styling, even if the content is important
- Agent notes always render with `bg-stone-100 text-stone-600` base + the `// Agent Tip` label
- This means `critical` on agent-sourced notes should either not be set, or be ignored in rendering
<!-- SECTION:NOTES:END -->
