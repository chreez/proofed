---
name: status
description: Situational awareness dashboard + controlled WIP save that sorts a dirty working tree across multiple tasks.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Task, AskUserQuestion, mcp__backlog__task_list, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_search
model: sonnet
argument-hint: [--shore | shore] or blank for dashboard
---

# Status Skill

Two modes: a quick situational snapshot (default), or a controlled WIP save that maps dirty files to backlog tasks and parks them on per-task branches.

## Usage

```
/status              # Dashboard — what's in-flight right now
/status shore        # Shore up — save WIP to per-task branches
/status --shore      # Same as above
```

## Mode 1: Dashboard (default)

Show a compact situational awareness snapshot. Think dashboard, not report.

### Data Collection

1. **Active task**: `task_list` filtered to `In Progress` — identify the current focus task
2. **Related items**: For each In Progress task, `task_view` to get subtasks and dependencies
3. **Session artifacts**: Check git for uncommitted changes and recent commits in this session:
   - `git status --short` — any dirty files?
   - `git log --oneline --since="8 hours ago"` — commits from this session
   - Cross-reference commit messages against backlog task IDs (PF-XX pattern)
4. **Drafts**: `task_search` with status Draft — any created recently?

### Dashboard Output

```
## Status

**Focus**: PF-XX — {title} ({status})
  Subtasks: X done / Y total | Blocked by: {none | PF-YY}

**Also in-flight**:
  PF-AA — {title} (In Progress, last commit 2d ago)

**Session commits**: 3 commits touching PF-XX, PF-AA
**Working tree**: {clean | X files modified, Y untracked}
**Drafts**: DRAFT-1 ({title}), DRAFT-2 ({title})
```

If the working tree is dirty, append a nudge:

```
Dirty tree — run `/status shore` to save WIP across tasks.
```

### Rules (Dashboard)

- **Read-only.** No modifications to files, tasks, or git state.
- **Compact.** One screen. No tables unless there are 4+ in-progress items.
- **Honest.** If nothing is in progress, say so. Don't fabricate context.

---

## Mode 2: Shore Up (`shore` or `--shore`)

Controlled WIP save. Maps every dirty file to a backlog task, creates per-task WIP branches, commits, updates task metadata, and returns mainline to clean.

### Phase 1: Inventory

Gather all changes in the working tree:

1. **Staged files**: `git diff --cached --name-only`
2. **Unstaged modified files**: `git diff --name-only`
3. **Untracked files**: `git ls-files --others --exclude-standard`

If the working tree is clean, report and exit:

```
Working tree is clean. Nothing to shore up.
```

### Phase 2: Map Files to Tasks

For each changed file, infer the backlog task it belongs to:

1. **Path-based mapping**:
   - `backlog/tasks/pf-XX*` or `backlog/drafts/draft-X*` → that task
   - `public/recipes/{recipe-id}.json` → search backlog for tasks mentioning that recipe
   - `src/components/{Component}.vue` → search recent In Progress tasks for component mentions

2. **Commit history**: `git log --oneline -5 -- {file}` — check if recent commits reference a PF-XX

3. **Backlog cross-reference**: `task_list` (In Progress) + `task_view` each — scan ACs and descriptions for file/component mentions

4. **Fallback**: Files that can't be confidently mapped go to `wip/unsorted`

### Phase 3: Present Mapping (HITL Gate)

Show the proposed mapping and wait for user confirmation:

```
## Shore Up — Proposed Mapping

### wip/pf-73 (PF-73: Fix scroll auto-advance)
- src/composables/useProgress.ts (modified)
- src/components/StageCard.vue (modified)
- backlog/tasks/pf-73.md (modified)

### wip/pf-110 (PF-110: Lightbox hero order)
- src/components/CookLogSection.vue (modified)

### wip/unsorted
- src/utils/helpers.ts (new — can't map to a task)

Confirm mapping? (y / edit / abort)
```

If user says **edit** → ask which files to reassign and to which task.
If user says **abort** → exit without changes.
Only proceed after explicit **y** or **yes**.

### Phase 4: Branch and Commit

For each task group:

1. **Create branch**: `git checkout -b wip/{pf-xxx}` from current HEAD
2. **Stage mapped files**: `git add {file1} {file2} ...` (specific files only, never `git add .`)
3. **Commit**: Use the project commit convention:
   ```
   wip: save in-progress work (PF-XX)
   ```
4. **Return to mainline**: `git checkout {original-branch}`

Repeat for each task group. Process `wip/unsorted` last (if any files).

For `wip/unsorted`:
```
wip: save unmapped in-progress work
```

After all branches are created, verify mainline is clean:
```
git checkout {original-branch}
git status
```

If mainline still has changes (shouldn't happen), flag it to the user.

### Phase 5: Update Tasks

For each task that got a WIP branch:

1. **MCP update**: `task_edit` with:
   - Status → `To Do` (demoted from In Progress since work is parked)
   - Implementation notes append: pickup context (see below)

2. **Pickup context** — append to implementation notes:
   ```
   ## WIP Pickup — {date}

   **Branch**: `wip/{pf-xxx}`
   **What was done**: {1-2 sentences summarizing the changes in the commit}
   **What's left**: {1-2 sentences on remaining work based on ACs}
   **Key decisions**: {any architectural choices made, or "none"}
   ```

3. The task markdown file is already on the WIP branch (staged in Phase 4), so no separate file edit is needed here — the MCP metadata and the notes update capture the pickup context.

### Phase 6: Summary

```
## Shore Up Complete

| Branch         | Task                           | Files | Status     |
|----------------|--------------------------------|-------|------------|
| wip/pf-73      | PF-73: Fix scroll auto-advance | 3     | Committed  |
| wip/pf-110     | PF-110: Lightbox hero order    | 1     | Committed  |
| wip/unsorted   | (unmapped)                     | 1     | Committed  |

Mainline ({branch}): clean
Tasks demoted to To Do: PF-73, PF-110

To resume: `git checkout wip/pf-73` and `/execute PF-73`
```

### Rules (Shore Up)

- **Never auto-execute.** Always show the mapping and wait for confirmation (Phase 3).
- **Specific staging only.** `git add {file}` — never `git add .` or `git add -A`.
- **One branch per task.** Don't combine multiple tasks on one branch.
- **Demote, don't delete.** Tasks go to `To Do`, never archived or deleted.
- **Pickup context is mandatory.** Every WIP branch must leave enough context for a future agent to resume without re-reading the full task history.
- **Mainline must end clean.** If it doesn't, something went wrong — flag it.
- **No build gate.** WIP commits are explicitly incomplete work. Don't run `npm run build` — it will likely fail. These commits exist only to park state.
- **Pre-commit hook bypass.** Since WIP commits are intentionally incomplete and won't pass the build gate, use `git commit --no-verify` for WIP commits only. This is the one exception to the normal commit flow.

## Arguments

- `$ARGUMENTS[0]` — Optional. If `shore` or `--shore`, run Mode 2. Otherwise, run Mode 1 (dashboard).
