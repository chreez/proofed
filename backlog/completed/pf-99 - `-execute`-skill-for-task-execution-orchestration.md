---
id: PF-99
title: '`/execute` skill for task execution orchestration'
status: Done
assignee: []
created_date: '2026-02-10 04:04'
updated_date: '2026-02-10 08:54'
labels:
  - dx
dependencies:
  - PF-102
priority: medium
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skill that takes a task or milestone, inspects subtasks, auto-grooms any ungroomed items (HITL), builds an execution plan with parallel/blocked indicators, batches HITL gates into minimal user touchpoints, and force-asks 2 clarifying questions per task to jog user memory. Maximizes autonomous progress between user gates. User has additional ideas to add during grooming.\n\nDepends on PF-102 (Draft status rework) — skill must reference the new status pipeline (Draft → To Do → In Progress → Done), not the deprecated `ungroomed` label. ACs #4 and #8 reference "ungroomed" and will need to use "Draft" once PF-102 lands.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `/execute` skill file exists at `.claude/skills/execute/SKILL.md` and is loadable by agents
- [x] #2 Skill accepts a single task ID (which may have subtasks) as input — agent adopts "get this done" mindset
- [x] #3 **Scope lock**: Agent reads the task + all subtasks, presents a high-level execution plan — 2-sentence goal summary, then task-by-task breakdown with parallel/blocked indicators
- [x] #4 **Ungroomed gate**: If any subtask is ungroomed, agent runs inline grooming (HITL) before execution begins
- [x] #5 **Just-in-time questions**: Before starting each subtask, agent asks 2 clarifying questions with enough context for the user to answer without re-reading the task
- [x] #6 **Autonomous execution**: Between HITL gates, agent executes autonomously. Known hard gates inherited from CLAUDE.md (visual/styling, demo review, cook log, grooming)
- [x] #7 **Tangent handling**: When user goes off-scope, agent echo-backs the tangent, then spawns a sub-agent to search backlog for duplicates and create/link the task if none exists — main context stays clean
- [x] #8 **Tangent filing**: Tangents filed ungroomed by default. If user insists on grooming now (to capture fleeting context), agent does quick context capture and applies it to the new task, then resumes execution
- [x] #9 **Tangent sub-agent**: Sub-agent searches existing backlog by similar terms before creating, avoids duplicates, returns task ID to main agent
- [x] #10 Skill is concise — playbook format, not prose
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Created /execute skill at .claude/skills/execute/SKILL.md. Orchestration skill with 4 phases: scope lock (load task + subtasks, present execution plan with parallel/blocked indicators), groom gate (inline HITL grooming for unready tasks), execute (autonomous with just-in-time questions and hard gates from CLAUDE.md), tangent handling (echo-back → sub-agent duplicate search → file as Draft). References Draft-by-default rule from PF-102. Updated ACs #4 and #8 to use Draft instead of deprecated ungroomed.
<!-- SECTION:FINAL_SUMMARY:END -->
