---
name: execute
description: Task execution orchestrator. Takes a task ID, builds an execution plan, grooms unready subtasks, compacts context, then dispatches subagents for autonomous implementation with batched user gates.
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task, AskUserQuestion, mcp__backlog__task_list, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_search, mcp__backlog__task_create
model: opus
argument-hint: <task-id> e.g. "PF-73"
---

# Execute Skill

Orchestrate a task from plan to done. Dispatch subagents for implementation, batch human gates, maintain backlog state continuously.

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

## Phase 3: Compact

After the execution plan is finalized and all grooming is complete, trigger `/compact` to shed planning and grooming conversation weight.

### What survives the compact:

- **Locked execution plan** — the full task table with ordering, parallel/blocked indicators
- **Task IDs and ACs** — every task's acceptance criteria in full
- **Key decisions** — choices made during grooming (e.g., "user chose approach B over A")
- **Gate rules** — hard gate definitions inherited from CLAUDE.md
- **Tangent handling protocol** — the full Phase 5 procedure

### Why compact here:

Phases 1–2 are conversational and exploratory — they generate context that isn't needed during execution. Compacting before dispatch keeps the orchestrator lean for the potentially long Phase 4 loop.

## Phase 4: Dispatch Loop

The orchestrator does not implement tasks itself. It dispatches subagents, manages gates, and maintains backlog state.

### Loop Structure

```
while unfinished tasks remain:
  1. Identify dispatchable tasks (unblocked, not yet dispatched)
  2. Pre-dispatch questions (if not skipped)
  3. Dispatch subagents
  4. As subagents return: bookkeeping + collect gate requests
  5. If more tasks dispatchable without hitting gates → loop to step 1
  6. When blocked on gates → batch-present all pending gates to user
  7. After gates resolved → commit approved work
  8. Loop
```

### Pre-Dispatch Questions

Before the first dispatch batch, ask just-in-time questions for all tasks in the batch:

```
Dispatching: PF-XX.1 ({title}), PF-XX.2 ({title})

Quick questions before I start:
1. PF-XX.1: {contextual question — e.g., "The AC says 'match existing pattern' — StageCard approach or different?"}
2. PF-XX.2: {contextual question — e.g., "Any edge case you've been thinking about?"}
```

If user says "just go" or similar → skip questions for all remaining dispatches.

### Subagent Dispatch

For each task, spawn a subagent via the Task tool with two context layers:

**High-level context** (shared across all subagents):
- Parent task title + description
- The full execution plan (so the subagent knows where its work fits)
- Key decisions made during planning/grooming

**Low-level context** (specific to this subagent):
- The specific subtask with full acceptance criteria
- Relevant files and patterns identified during planning
- Any user answers from pre-dispatch questions

**Subagent rules:**
- The subagent does the implementation work (code, tests, file changes)
- The subagent does NOT interact with the user — it returns results to the orchestrator
- If the subagent hits a hard gate (visual change, cook log, demo), it returns a **gate request** describing what needs user review
- If the subagent encounters ambiguity, it picks the simpler approach and notes the choice

Dispatch independent tasks in parallel when possible.

### Bookkeeping (continuous)

After each subagent returns, the orchestrator immediately:

1. **Updates the backlog item** via `task_edit`:
   - Append implementation notes with what was done, files changed, decisions made
   - Set status to `In Progress` if not already
   - Record any gate requests pending user review
2. **Updates the execution plan** tracking table with subagent results

This happens continuously, not just at completion. If the session is interrupted, backlog items reflect current state — a future agent can pick up where this one left off.

### Batched Human Gates

After each subagent returns, the orchestrator checks: **can more tasks be dispatched without hitting a human gate?**

- **Yes** → dispatch the next batch, keep going
- **No** (all remaining tasks are blocked on gates or dependencies) → pause and present all pending gates in one batch

**Gate batch presentation:**

```
## Gates Pending — {N} items need your input

### Visual Review (2 items)
1. PF-XX.1: {title}
   Before: {description}  After: {description}
   URL: http://<LAN_IP>:<PORT>/{path}

2. PF-XX.3: {title}
   Before: {description}  After: {description}
   URL: http://<LAN_IP>:<PORT>/{path}

### Cook Log Clarify (1 item)
3. PF-XX.2: {question needing clarification}

Approve all / review individually
```

**Hard gates** (always require user interaction — inherited from CLAUDE.md):
- Visual/styling changes → open URL, present before/after, wait for approval
- Cook log entries → clarify loop mandatory
- Demo review → user picks approach

### Commit Flow (after gate approval)

After batched gates are resolved by the user:

1. For each approved task, stage code + task file together (`git add {specific files}`)
2. Run `npm run build` — must pass before each commit
3. Create one atomic commit per task: `<type>: <description> (PF-XX)`
4. Update task status to Done via `task_edit`

If a gate is rejected (user requests changes):
1. Re-dispatch a subagent with the feedback
2. On return, re-present just that gate
3. Once approved, commit as above

## Phase 5: Tangent Handling

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

- **Default**: Create as Draft, report task ID, resume dispatch loop
- **If user says "groom it now"**: Do a quick context capture — ask 2-3 rapid questions to capture the fleeting context, save as implementation notes on the new Draft, then resume. Don't do a full grooming session.

```
Filed as DRAFT-X: {title}
Resuming dispatch loop...
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
- **Orchestrator doesn't implement.** All implementation work is dispatched to subagents via the Task tool.
- **Subagents don't talk to users.** Gate requests return to the orchestrator, which batches them for the user.
- **Batch user gates.** Dispatch everything possible before pausing. Present all pending gates in one interaction.
- **Continuous bookkeeping.** Update backlog items after every subagent return, not just at completion.
- **Stage task files with code.** Every commit includes both `src/` changes and `backlog/tasks/pf-XX*.md` updates.
- **Build before commit.** `npm run build` must pass before every commit.
- **Hard gates are non-negotiable.** Visual review, cook log clarify, demo review — these always pause for user.
