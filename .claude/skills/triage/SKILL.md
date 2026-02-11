---
name: triage
description: Backlog health dashboard + quick-fire triage flow. Reviews stale tasks, validates in-progress claims, surfaces merge candidates.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Task, mcp__backlog__task_list, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_search, mcp__backlog__task_archive
model: sonnet
argument-hint: (no arguments)
---

# Triage Skill

Backlog health check + guided triage. Run periodically to keep the backlog clean.

## Usage

```
/triage
```

## Phase 1: Health Dashboard

Build a summary table from backlog data:

### Data Collection

1. `task_list` — get all tasks with status, priority, labels
2. For each **In Progress** task: check git evidence (see Stale Detection below)
3. Count **active** tasks (To Do / In Progress) with no acceptance criteria — ignore Done tasks (legacy, no action needed)

### Dashboard Output

```
## Backlog Health

| Metric               | Count |
|----------------------|-------|
| Total tasks          | XX    |
| Draft                | XX    |
| To Do                | XX    |
| In Progress          | XX    |
| In Progress (stale)  | XX    |
| Ungroomed (legacy)   | XX    |
| Missing ACs (active) | XX    |
| Done (unclosed)      | XX    |
```

### Stale Detection

For each In Progress task:

1. Extract task ID (e.g., PF-73)
2. Run: `git log --oneline --since="7 days ago" --all -- "backlog/tasks/pf-73*" "src/"` grepping for the task ID in commit messages
3. If no commits reference the task in 7+ days → **stale**
4. Present stale tasks to user with last commit date and ask to confirm demotion

**Rule**: Never auto-demote. Present evidence, let user decide.

```
### Stale In-Progress

| Task  | Title                    | Last Activity | Action?          |
|-------|--------------------------|---------------|------------------|
| PF-73 | Fix scroll auto-advance  | 12 days ago   | Demote to To Do? |

Demote all / pick individually / skip
```

## Phase 2: Quick-Fire Triage

After dashboard review, iterate through **actionable tasks** in this priority:

1. Stale In Progress (already surfaced above)
2. Drafts awaiting grooming
3. Legacy ungroomed tasks (PF- with no ACs)
4. Low-priority tasks older than 30 days

### Per-Task Display

```
**PF-XX: {title}** ({status}, {priority}, {age} days old)
> {description first sentence}

Recommended: {action}   |   groom / defer / kill / merge / skip
```

### Action Definitions

| Action | What Happens |
|--------|-------------|
| **groom** | Run inline grooming (Intent Translator MAX) on this task |
| **defer** | Keep as-is, skip for now |
| **kill** | Archive the task (requires confirmation) |
| **merge** | Merge into another task (agent searches for candidates, user confirms) |
| **skip** | Move to next task without recording a decision |

### Merge Detection

When user selects **merge** (or agent recommends it):

1. `task_search` with key terms from the task title
2. Present candidate matches with similarity reasoning
3. User picks merge target → agent combines descriptions/ACs into target, archives source

### Batch Confirmation

Collect all triage decisions, then present summary before executing:

```
### Triage Summary

- Demote to To Do: PF-73, PF-55
- Archive: PF-57
- Merge PF-53 → PF-86
- Groom next session: PF-91, PF-94

Execute all? (y/n)
```

Only after user confirms → execute all MCP operations.

## Rules

- **No autonomous kills.** Every archive/delete requires explicit user confirmation.
- **Evidence-based.** Stale detection uses git history, not guesswork.
- **Batch, don't drip.** Collect decisions, confirm once, execute once.
- **Read-only until confirmed.** No MCP writes until the user approves the batch.
- **Draft-by-default.** Any new tasks created during triage enter as Draft.
