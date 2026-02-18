---
id: PF-149
title: execute-async skill - background agent dispatch for parallel task execution
status: To Do
assignee: []
created_date: '2026-02-17 23:19'
labels:
  - dx
  - workflow
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New skill `/execute-async` — same workflow as `/execute` but dispatches implementation agents in the background so the user can queue up multiple (potentially unrelated) tasks in the same session.

Instead of blocking on each subagent, uses `run_in_background: true` and lets the orchestrator manage multiple concurrent execution streams. User can kick off PF-128 implementation, then immediately start grooming DRAFT-9, then execute PF-129 — all in one session.

Key design challenges: HITL gate batching when multiple tasks are in flight, commit ordering when parallel tasks touch overlapping files, context window management with multiple background agents reporting back, and whether this is a separate skill or a flag on `/execute`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spike subtask completed: documents concurrency design — separate skill vs `--async` flag, HITL gate batching strategy, commit conflict resolution approach
- [ ] #2 Skill file exists at `.claude/skills/execute-async/SKILL.md` (or flag added to existing `/execute` skill, per spike findings)
- [ ] #3 Background dispatch uses `run_in_background: true` for implementation subagents
- [ ] #4 Multiple unrelated tasks can be queued and executing concurrently in one session
- [ ] #5 HITL gates from concurrent tasks are batched into a single user review pass (not interleaved)
- [ ] #6 Commit ordering prevents conflicts when parallel tasks touch overlapping files (queue or lock strategy)
- [ ] #7 Guard rails defined: max concurrent agents, context window budget, failure isolation per task
<!-- AC:END -->
