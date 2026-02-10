---
name: validate-execution-plan
description: Grade an execution plan against backlog tasks. Catches drift where the plan diverges from what ACs actually say.
user-invocable: true
allowed-tools: Read, Grep, Glob, mcp__backlog__task_list, mcp__backlog__task_view, mcp__backlog__task_search
model: sonnet
argument-hint: <task-id> [task-id...] — task IDs to validate against
---

# Validate Execution Plan

Read-only sub-agent skill. Takes an execution plan and grades each item against the backlog golden source. Surfaces drift, missing coverage, and untracked scope.

## Usage

```
/validate-execution-plan PF-99 PF-100 PF-103
```

Run this after building an execution plan and before starting implementation. The plan can be inline in the conversation or referenced by context.

## Inputs

1. **Execution plan** — the plan text from the current conversation context
2. **Task IDs** — `$ARGUMENTS` as space-separated backlog task IDs to validate against

## Step 1: Load Tasks

For each task ID in `$ARGUMENTS`:

1. `task_view` to get full task details
2. Extract: title, description, acceptance criteria, dependencies, status

If a task ID doesn't exist, flag it immediately as `INVALID — task not found`.

## Step 2: Per-Task Grading

For each plan item, find the corresponding backlog task and grade:

### Grade: PASS

Plan item faithfully represents the task ACs. No reinterpretation, no omissions, no additions.

### Grade: DRIFT

Plan item diverges from what the ACs say. Types of drift:

- **Reinterpretation** — plan describes the work differently than ACs specify
- **Scope addition** — plan adds work not in any AC
- **Scope reduction** — plan omits ACs that exist on the task
- **Changed priority/order** — plan reorders work in a way that violates dependencies

### Grade: MISSING

An AC exists on the task but has no corresponding plan item. The plan doesn't cover it.

## Step 3: Untracked Scope

Identify plan items that don't map to any backlog task AC. These are scope additions — not necessarily wrong, but should be explicit.

Flag each as: `UNTRACKED — {description of what the plan adds}`

## Step 4: Dependency Check

1. Build a dependency graph from task `dependencies` fields
2. Check that the plan's execution order doesn't violate dependency chains
3. Flag any ordering violations: `DEPENDENCY — {task} planned before its dependency {dep-task}`

## Step 5: Report

Output a single report:

```
## Execution Plan Validation

### Per-Task Grades

| Task   | Title                  | Grade   | Details                              |
|--------|------------------------|---------|--------------------------------------|
| PF-103 | /triage skill          | PASS    | All 9 ACs covered                    |
| PF-99  | /execute skill         | DRIFT   | AC #7 reinterpreted — see below      |
| PF-100 | /validate-exec-plan    | MISSING | AC #6 (dependency check) not in plan |

### Drift Details

**PF-99 AC #7 — Tangent handling**
- AC says: "agent echo-backs the tangent, then spawns a sub-agent to search backlog"
- Plan says: "log tangents for later review"
- Drift type: Reinterpretation — plan simplifies the specified behavior

### Untracked Scope

| Item                          | Maps to |
|-------------------------------|---------|
| "Add retry logic for MCP"     | No AC   |

### Dependency Violations

None / {list violations}

### Summary

- Tasks validated: X
- PASS: X | DRIFT: X | MISSING: X
- Untracked items: X
- Dependency violations: X
```

## Rules

- **Read-only.** This skill produces a report. It never modifies tasks, plans, or files.
- **Quote both sides.** When flagging drift, quote the AC text AND the plan text so the user can compare.
- **No judgment calls.** Flag drift objectively. The user decides if drift is acceptable.
- **ACs are truth.** The backlog is the golden source. The plan is what's being validated, not the other way around.
