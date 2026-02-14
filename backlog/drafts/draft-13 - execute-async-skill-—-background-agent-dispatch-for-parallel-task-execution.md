---
id: DRAFT-13
title: execute-async skill — background agent dispatch for parallel task execution
status: Draft
assignee: []
created_date: '2026-02-13 18:31'
labels:
  - dx
  - workflow
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New skill `/execute-async` — same workflow as `/execute` but dispatches implementation agents in the background so the user can queue up multiple (potentially unrelated) tasks in the same session.

**Key difference from `/execute`:** Instead of blocking on each subagent, uses `run_in_background: true` and lets the orchestrator manage multiple concurrent execution streams. User can kick off PF-128 implementation, then immediately start grooming DRAFT-9, then execute PF-129 — all in one session.

**Open questions:**
- How to handle HITL gates when multiple tasks are in flight (batching becomes more complex)
- Commit ordering when parallel tasks touch overlapping files
- Context window management with multiple background agents reporting back
- Whether this is a separate skill or a flag on `/execute` (e.g., `/execute PF-73 --async`)
<!-- SECTION:DESCRIPTION:END -->
