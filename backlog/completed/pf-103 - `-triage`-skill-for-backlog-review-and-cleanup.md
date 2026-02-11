---
id: PF-103
title: '`/triage` skill for backlog review and cleanup'
status: Done
assignee: []
created_date: '2026-02-10 04:58'
updated_date: '2026-02-10 08:51'
labels:
  - dx
dependencies:
  - PF-102
priority: medium
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skill that provides a diagnostic dashboard of backlog health (stale tasks, in-progress validation, Draft/ungroomed count), then guides the user through quick-fire triage decisions per task (groom, defer, kill, merge, skip). Sub-agent validates in-progress claims by checking git evidence — presents stale tasks for user-confirmed demotion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /triage skill file exists at .claude/skills/triage/SKILL.md and is loadable by agents
- [x] #2 Health dashboard: Skill opens with a summary view — total tasks, status breakdown, stale in-progress count, Draft/ungroomed count, tasks with no ACs
- [x] #3 Stale detection: Sub-agent checks in-progress tasks against git log (last commit touching related files) — flags tasks with no related commits in 7+ days
- [x] #4 Auto-demote: Stale in-progress tasks presented to user with evidence — user confirms demotion back to To Do (not automatic)
- [x] #5 Quick-fire triage: After dashboard, skill iterates through actionable tasks (Drafts, ungroomed, stale) with one-line summary + recommended action (groom, defer, kill, merge, skip)
- [x] #6 Merge detection: When triaging, skill searches backlog for similar tasks by title/description — suggests merge candidates
- [x] #7 Batch operations: User can answer triage decisions rapid-fire; skill batches all MCP edits and executes after confirmation
- [x] #8 No autonomous kills: Skill never deletes/archives tasks without explicit user confirmation per task
- [x] #9 Skill is concise — playbook format, not prose
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Created /triage skill at .claude/skills/triage/SKILL.md. Playbook-format skill with two phases: health dashboard (status breakdown, stale detection via git log, missing ACs count) and quick-fire triage flow (groom/defer/kill/merge/skip per task). Includes merge detection via task_search, batch confirmation before MCP writes, and explicit no-autonomous-kills rule.
<!-- SECTION:FINAL_SUMMARY:END -->
