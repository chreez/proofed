---
name: groom
description: Intent Translator MAX grooming protocol. Turns rough ideas into iron-clad work orders with agent-verifiable acceptance criteria.
user-invocable: true
allowed-tools: Read, Grep, Glob, AskUserQuestion, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_create, mcp__backlog__task_search, mcp__backlog__task_list
model: opus
argument-hint: <task-id> [auto] e.g. "PF-73" or "DRAFT-5 auto"
---

# Groom Skill

Turn a rough idea into an iron-clad work order with agent-verifiable acceptance criteria.
**Grooming only — no code, no implementation.**

## Usage

```
/groom PF-73
/groom DRAFT-5
/groom PF-92 auto
```

## Phase 1: Load

1. `task_view` on `$ARGUMENTS[0]` — get full task details
2. If task has a parent, `task_view` the parent for context
3. If task has subtasks, `task_view` all of them
4. Check dependencies — load any referenced tasks

## Phase 2: Silent Scan

Do not respond yet. Privately:

1. Read the task details, related tasks, dependencies
2. Search the workspace for files, components, types, and patterns related to the task:
   - `Grep` for keywords from the task title/description in `src/`
   - `Glob` for files that might be affected
   - `Read` key files to understand existing patterns
3. Note what exists vs what would be new
4. List every fact or constraint you still need to clarify

## Phase 3: Clarify Loop

Ask **one question at a time** until ≥95% confidence you understand the intent.

- Cover: purpose, success criteria, edge cases, scope boundaries (what's NOT included), UX behavior, existing patterns to match
- Keep questions tight. Don't ask what you can infer from context or the code you scanned
- Questions should be grounded in what you found in the codebase
- Use `AskUserQuestion` for each question

**Skip this phase if `auto` is in `$ARGUMENTS`** (auto groom mode).

## Phase 4: Echo Check

Reply with **one crisp sentence** stating:
- What the task delivers
- \#1 must-include behavior
- Hardest constraint

End with: `YES to lock / EDITS / DEMO`

- **YES** → proceed to Phase 6 (Write ACs)
- **EDITS** → re-enter Clarify Loop (Phase 3)
- **DEMO** → proceed to Phase 5

## Phase 5: Demo (optional)

If user chooses DEMO at echo check:

1. Create a spike subtask via `task_create`:
   - Title: `Demo: {parent title} — visual options`
   - Parent: the task being groomed
   - Status: `To Do`
   - Description: throwaway demo page showing visual options side-by-side
2. Demo spike = disposable — code is not production, just enough to evaluate visually
3. If multiple tasks in a session need demos, **batch them** for a single user review pass
4. After user picks an approach, close the demo spike and feed chosen direction into ACs
5. Proceed to Phase 6

## Phase 6: Write ACs

Only after YES (or after demo review).

1. Write agent-verifiable acceptance criteria
2. **Present ACs to user for approval before saving** — show the full AC list and wait for explicit OK
3. ACs describe *what*, not *how* — no code, not even pseudocode

## Phase 7: Save

After user approves ACs:

1. If task was a Draft:
   - Run `backlog draft promote DRAFT-X` first (moves file from `backlog/drafts/` → `backlog/tasks/`, assigns PF- ID)
   - Then `task_edit` the new PF- ID to set acceptance criteria
   - Verify draft file is gone: `ls backlog/drafts/ | grep -i <id>`
2. If task is an existing PF- task:
   - `task_edit` to set acceptance criteria
   - If task has `ungroomed` label → remove it
3. Stage the task file for commit:
   - Draft promoted: stage `backlog/tasks/pf-XX*.md` (new location after promotion)
   - Existing task: stage `backlog/tasks/pf-XX*.md`
4. Report completion: task ID, new status, AC count

## Spike Subtasks

Create spike subtasks liberally when research is needed before implementation. Spikes are delegated to future agents — don't execute them in the current session.

**Spike ID format:** `PF-XX.1`, `PF-XX.2` (subtasks of the parent)

**Categories that warrant a spike:**
- **Web research** — best practices, library trends, up-to-date documentation
- **Hard sources** — recipes, cooking techniques, anything needing citations
- **Exploratory code investigation** — "why doesn't X work", debugging root causes, codebase archaeology

**Spike output** gets documented in the parent task's implementation notes, informing the implementation phase.

## Rules

- **No code.** Not even pseudocode. ACs describe *what*, not *how*.
- **No implementation planning.** That happens when the task is picked up.
- **One task at a time.** Finish grooming before moving to the next.
- **Show before saving.** User approves AC text before it hits the task file.
- **Grounded questions.** Clarify loop questions should reference what you found in the codebase, not generic questions.

## Arguments

- `$ARGUMENTS[0]` — Task ID to groom (required). e.g., `PF-73`, `DRAFT-5`
- `$ARGUMENTS[1]` — Optional. If `auto`, skip Clarify Loop (auto groom mode)
