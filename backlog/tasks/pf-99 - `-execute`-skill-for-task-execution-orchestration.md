---
id: PF-99
title: '`/execute` skill for task execution orchestration'
status: To Do
assignee: []
created_date: '2026-02-10 04:04'
updated_date: '2026-02-10 04:47'
labels:
  - dx
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skill that takes a task or milestone, inspects subtasks, auto-grooms any ungroomed items (HITL), builds an execution plan with parallel/blocked indicators, batches HITL gates into minimal user touchpoints, and force-asks 2 clarifying questions per task to jog user memory. Maximizes autonomous progress between user gates. User has additional ideas to add during grooming.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `/execute` skill file exists at `.claude/skills/execute/SKILL.md` and is loadable by agents
- [ ] #2 Skill accepts a single task ID (which may have subtasks) as input — agent adopts "get this done" mindset
- [ ] #3 **Scope lock**: Agent reads the task + all subtasks, presents a high-level execution plan — 2-sentence goal summary, then task-by-task breakdown with parallel/blocked indicators
- [ ] #4 **Ungroomed gate**: If any subtask is ungroomed, agent runs inline grooming (HITL) before execution begins
- [ ] #5 **Just-in-time questions**: Before starting each subtask, agent asks 2 clarifying questions with enough context for the user to answer without re-reading the task
- [ ] #6 **Autonomous execution**: Between HITL gates, agent executes autonomously. Known hard gates inherited from CLAUDE.md (visual/styling, demo review, cook log, grooming)
- [ ] #7 **Tangent handling**: When user goes off-scope, agent echo-backs the tangent, then spawns a sub-agent to search backlog for duplicates and create/link the task if none exists — main context stays clean
- [ ] #8 **Tangent filing**: Tangents filed ungroomed by default. If user insists on grooming now (to capture fleeting context), agent does quick context capture and applies it to the new task, then resumes execution
- [ ] #9 **Tangent sub-agent**: Sub-agent searches existing backlog by similar terms before creating, avoids duplicates, returns task ID to main agent
- [ ] #10 Skill is concise — playbook format, not prose
<!-- AC:END -->
