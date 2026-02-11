---
name: execute
description: Task execution orchestration. Takes a task ID, builds an execution plan, grooms unready subtasks, and drives autonomous implementation with minimal user gates.
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task, AskUserQuestion, mcp__backlog__task_list, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_search, mcp__backlog__task_create
model: opus
argument-hint: <task-id> e.g. "PF-73"
---

# Execute Skill

Take a task and get it done. Autonomous execution with minimal, batched user gates.

## Usage

```
/execute PF-73
/execute PF-92
```

## Phase 1: Scope Lock

### Load

1. `task_view` on `$ARGUMENTS[0]` — get full task details
2. If task has subtasks, load all of them
3. Read task dependencies — check if any are unresolved (status != Done)

### Unresolved Dependencies

If a dependency isn't Done, stop and report:

```
Blocked: PF-XX depends on PF-YY (status: To Do)
Options: execute PF-YY first / skip dependency / abort
```

### Readiness Check

For each task/subtask, check:
- Has acceptance criteria? If no → **needs grooming**
- Status is Draft or has `ungroomed` label? → **needs grooming**

### Execution Plan

Present to user:

```
## Execution Plan: PF-XX — {title}

{2-sentence goal summary: what this delivers and why it matters}

| #  | Task   | Title              | Status   | Blocked By | Action      |
|----|--------|--------------------|----------|------------|-------------|
| 1  | PF-XX  | Parent task        | To Do    | —          | Execute     |
| 2  | PF-XX.1| Spike research     | To Do    | —          | Execute (parallel) |
| 3  | PF-XX.2| Implementation     | To Do    | PF-XX.1    | Execute (blocked) |
| 4  | PF-XX.3| Design decision    | Draft    | —          | Groom first |

Needs grooming: PF-XX.3
HITL gates: visual review (CLAUDE.md), grooming (PF-XX.3)
```

Wait for user confirmation before proceeding.

## Phase 2: Groom Gate

If any tasks need grooming, invoke `/groom {task-id}` for each — user needs to participate in the clarify loop.

- After ACs are approved and saved, update the execution plan
- Then proceed to Phase 3

## Phase 3: Execute

Work through the execution plan in order, respecting blocked/parallel indicators.

### Before Each Task

**Just-in-time questions**: Ask 2 clarifying questions that jog the user's memory. Provide enough context so the user can answer without re-reading the task.

```
Starting PF-XX.2: {title}
ACs: {brief list}

Quick questions before I start:
1. {contextual question — e.g., "The AC says 'match existing pattern' — are you thinking of the StageCard approach or something different?"}
2. {contextual question — e.g., "Any specific edge case you've been thinking about since writing this?"}
```

If user says "just go" or similar → skip questions for remaining tasks.

### During Execution

- **Autonomous by default.** Execute without asking unless hitting a hard gate.
- **Hard gates** (inherited from CLAUDE.md — always pause):
  - Visual/styling changes → open URL, present before/after, wait for approval
  - Cook log entries → clarify loop mandatory
  - Demo review → user picks approach
  - Grooming → Intent Translator MAX
- **Soft gates** (use judgment):
  - Ambiguous AC interpretation → ask briefly, don't block
  - Multiple valid approaches → pick the simpler one, note the choice

### Between Tasks

- Set completed task to Done via MCP
- Stage task file with code in the same commit
- Run `npm run build` before each commit
- Move to next unblocked task

## Phase 4: Tangent Handling

When the user goes off-scope during execution:

### Step 1: Echo Back

```
Heard: "{user's tangent summarized in one sentence}"
That's outside PF-XX scope. Let me file it and stay on track.
```

### Step 2: Search for Duplicates

Use a sub-agent (Task tool) to:
1. `task_search` with key terms from the tangent
2. Check top 3-5 results for semantic overlap
3. If duplicate found → link to existing task, tell user
4. If no duplicate → create new task as **Draft** (Draft-by-default rule)

### Step 3: File and Resume

- **Default**: Create as Draft, report task ID, resume execution
- **If user says "groom it now"**: Do a quick context capture — ask 2-3 rapid questions to capture the fleeting context, save as implementation notes on the new Draft, then resume. Don't do a full grooming session.

```
Filed as DRAFT-X: {title}
Resuming PF-XX.2...
```

## Completion

After all tasks are done:

```
## Execution Complete: PF-XX

| Task    | Status | Commit  |
|---------|--------|---------|
| PF-XX.1 | Done   | abc1234 |
| PF-XX.2 | Done   | def5678 |
| PF-XX.3 | Done   | ghi9012 |

Tangents filed: DRAFT-3 (grocery list feature), DRAFT-4 (mobile nav bug)
```

## Rules

- **Scope is sacred.** The execution plan is the contract. New work goes to tangent handling, not inline.
- **Draft-by-default.** All tangent tasks enter as Draft. No exceptions unless user explicitly grooms in-session.
- **Batch user gates.** Minimize interruptions. Group questions, present plans upfront, execute autonomously between gates.
- **Stage task files with code.** Every commit includes both `src/` changes and `backlog/tasks/pf-XX*.md` updates.
- **Build before commit.** `npm run build` must pass before every commit.
- **Hard gates are non-negotiable.** Visual review, cook log clarify, demo review — these always pause for user.
