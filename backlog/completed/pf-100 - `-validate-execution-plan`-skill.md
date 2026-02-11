---
id: PF-100
title: '`/validate-execution-plan` skill'
status: Done
assignee: []
created_date: '2026-02-10 04:04'
updated_date: '2026-02-10 08:52'
labels:
  - dx
dependencies:
  - PF-102
priority: medium
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sub-agent skill that reads an execution plan and grades each item against the backlog (golden source). Catches drift where the plan diverges from what tasks actually say — ensures sub-agents don't reinterpret intent. Read-only validation, never modifies tasks or plans.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /validate-execution-plan skill file exists at .claude/skills/validate-execution-plan/SKILL.md and is loadable by agents
- [x] #2 Skill accepts an execution plan (inline text or task context) and a list of task IDs to validate against
- [x] #3 Per-task grading: For each plan item, skill reads the corresponding backlog task ACs and grades alignment — PASS (plan matches ACs), DRIFT (plan reinterprets or adds scope), MISSING (AC not covered by plan)
- [x] #4 Drift report: Output is a table — task ID, grade, specific drift description with quotes from both plan and AC
- [x] #5 Scope additions flagged: Items in the plan that don't map to any backlog AC are flagged as untracked scope — not auto-rejected, just surfaced
- [x] #6 Dependency check: Validates that plan execution order respects task dependency chains
- [x] #7 Skill is read-only — produces a report, never modifies tasks or plans
- [x] #8 Skill is concise — playbook format, not prose
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Created /validate-execution-plan skill at .claude/skills/validate-execution-plan/SKILL.md. Read-only sub-agent that grades execution plans against backlog ACs as golden source. Produces per-task grades (PASS/DRIFT/MISSING), flags untracked scope additions, validates dependency ordering. Playbook format with quote-both-sides rule for drift reporting.
<!-- SECTION:FINAL_SUMMARY:END -->
