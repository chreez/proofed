# Bake Workflow Project

JSON-first recipe workflow system. Swap data, not code.

## Tech Stack
- Vite + Vue 3 (Composition API) + TypeScript
- UnoCSS with warm stone palette
- Recipes as JSON in `public/recipes/`

## Commands
- `npm run dev` - Start dev server at http://localhost:5173
- `npm run build` - Coverage + type-check + build (full gate)
- `npm run coverage` - Run tests with coverage thresholds

## Project Structure
```
src/
├── types/recipe.ts       # Recipe JSON schema types
├── composables/          # Vue composables (useRecipe, useTimer, useProgress)
├── components/           # Vue components
public/recipes/
├── index.json            # Recipe manifest
├── *.json                # Individual recipe files
```

## Recipe JSON Contract
- All weights in **grams only** (no cups/tbsp)
- Temperatures in **Fahrenheit** with Celsius in parentheses
- Dimensions in **centimeters**
- `timer: true` ONLY on passive states (rise, bake, cool)
- Every state MUST have `exit_condition`
- Ingredient breakdown sums MUST equal totals

## Feature Workflow (STRICT ORDER)

```
1. CLARIFY    → Ask questions until ≥95% confidence on intent
2. CHECKLIST  → Add validation criteria BEFORE coding
3. IMPLEMENT  → Build the feature
4. VALIDATE   → Run checks against updated checklist
```

**NEVER add to validation checklist without clarifying intent first.**
**NEVER implement before checklist is updated.**

See @.claude/rules/validation/checklist.md for criteria.

## Human-in-the-Loop Gates

Styling and visual tasks require explicit human sign-off before commit. This applies to:

- Any backlog task with labels `bug (styling)` or `ux`
- Any task whose title or description mentions CSS, padding, margin, layout, spacing, color, font, or visual changes
- Any component change that alters rendered appearance (even if "minor")

### Gate Requirements

1. **Before committing**, the agent MUST:
   - Ensure dev server is running (check port 5173, start `npm run dev` if needed)
   - Construct the most relevant URL for the change:
     - Recipe page: `http://localhost:5173/recipe/atk-cinnamon-buns-ultimate`
     - Specific section: append hash `#stage-prep`, `#cook-log-section`, `#version-history-section`
     - Index page: `http://localhost:5173/`
   - Open the URL with `open <url>` (macOS default browser)
   - Print the iPhone URL: `http://192.168.1.213:5173/...` (same path)
   - Present a **before/after description** of the visual changes
   - Ask the user to confirm the changes look correct on their device(s)
   - Wait for explicit user approval (e.g., "looks good", "approved", "ship it")

2. **Do NOT commit styling changes autonomously.** Even if the build passes and tests pass, visual correctness requires human eyes.

3. **Backlog status**: Styling tasks cannot be marked `Done` without explicit user sign-off. If the user has not confirmed, leave the task `In Progress`.

4. **If the user requests changes**, iterate and re-present before/after. Do not commit until approved.

### What counts as a styling task?

When in doubt, treat it as a styling task. Examples:
- Changing UnoCSS shortcuts or theme values in `uno.config.ts`
- Modifying `<template>` structure that affects layout
- Adding/removing CSS classes on components
- Adjusting padding, margin, gap, font-size, color, border
- Responsive design changes (mobile/desktop breakpoints)

## Task Management (backlog.md)
- Tasks live in `backlog/tasks/` as markdown files — **never edit directly**
- Use CLI: `backlog task create`, `backlog task edit`, `backlog task list`
- Use `--plain` flag when agents read tasks
- Board view: `backlog board` (terminal) or `backlog browser` (web)
- Task prefix: `pf` (e.g., PF-1, PF-2)
- MCP server available: tools like `task_list`, `task_create`, `task_view`

### Grooming Rules
- Follow the **Intent Translator MAX** protocol in `.claude/rules/grooming.md`
- **Draft-by-default**: ALL new tasks enter as Draft (`status: Draft`) unless groomed in the same session. No exceptions — agents must never create To Do tasks without completing the clarify/intent loop first.
- New ideas enter as Drafts via MCP (`status: Draft`) — they live in `backlog/drafts/` with `DRAFT-X` IDs until groomed
- Grooming promotes a Draft to a PF- task (status To Do) with agent-verifiable ACs
- Legacy: some existing PF- tasks still have `ungroomed` label — groom in place, strip label when done
- **"auto groom"** = skip clarify loop, go straight to echo check + ACs
- **"demo"** = at echo check, creates a spike subtask for throwaway demo page showing visual options side-by-side. Batch multiple demos per session for single user review pass

### Task Decomposition
- **Simple work (bugs, small fixes)**: flat single task
- **Complex features (Medium+ priority, multi-phase)**: parent + subtasks
- **2-level max**: parent → subtasks only, never deeper
- **Phase-based subtasks**: `spike` → `design` → `implement` (not implementation steps)

### Spike Subtasks
- Create liberally when research is needed before implementation
- **Categories**: web research (best practices, library trends), hard sources (recipes, techniques needing citations), exploratory code investigation ("why doesn't X work")
- Spike IDs: `PF-XX.1`, `PF-XX.2` (subtasks via `-p parent-id`)
- Spikes are delegated to future agents — don't launch agents in the current session
- Output documented in parent task notes → informs implementation
- Subtask IDs: `PF-14.1`, `PF-14.2`, etc. via `-p parent-id`
- MCP `task_list` shows parents only; `task_view` reveals subtasks

## Git Commit Convention

- **One logical change per commit** — don't mix features, bugs, or refactors
- **Each commit must pass `npm run build`** (tests + type-check + build)
- **Reference backlog task ID** when applicable: `fix: header padding (PF-17)`
- **Commit between backlog items** — don't batch multiple tasks into one commit
- **Stage specific files** — use `git add <file>` not `git add .` or `git add -A`
- **Message format**: `<type>: <description> (PF-XX)`
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
  - Keep description concise, lowercase, imperative mood
- **Examples**:
  - `feat: add version to recipe title (PF-18)`
  - `fix: remove header box styling (PF-17)`
  - `chore: remove unused TocPill component`
  - `test: add StageCard header styling tests`

## Snapshot Tests

HTML snapshot tests guard component structure. They catch unintended regressions: removed wrappers, missing classes, broken layouts.

### Build Commands
- `npm run build:fast` — type-check + bundle only (skip tests). Use for fast iteration.
- `npm run build:test` — tests only. Use to check test status without building.
- `npm run build` — full gate (tests + type-check + bundle). Required before every commit.

### Agent Snapshot Protocol
- If a snapshot fails unexpectedly during `npm run build`:
  1. **STOP.** Inspect the diff. Was this component supposed to change?
  2. If ≤2 snapshots broke from your change: note the changes, run `npx vitest --update`, continue.
  3. If ≥3 snapshots broke: **STOP.** Present the blast radius to the user before proceeding.
- Update snapshots: `npx vitest --update` (then re-run `npm run build` to confirm)
- Forensic use: `git log -p src/components/__snapshots__/` to trace when a component's structure changed
- Snapshot diffs are compact and greppable — use them to investigate reported bugs ("when did this button change?")

### Covered Components
StageCard, RecipeMeta, CookLogSection, VersionTimeline, GatherSection, TocSidebar

### Backlog Commit Rules

- **Backlog changes always get their own commit** — new tasks, grooming, triage, status updates
  - `chore(backlog): add PF-23 step easing`
  - `chore(backlog): groom PF-17, PF-18`
  - `chore(backlog): triage and prioritize new items`
- **Feature commits include their task file update** — when closing a task, the code change AND the pf-XX.md status update go in the same commit
  - `fix: remove header box styling (PF-17)` includes both src/ changes and backlog/tasks/pf-17 update
- **Steering doc updates get their own commit** — CLAUDE.md, checklist.md, memory changes
  - `docs: add backlog commit rules to CLAUDE.md`
- **Never let backlog files drift uncommitted** — commit after every grooming/triage session

### Pre-commit Hook

A pre-commit hook at `.git/hooks/pre-commit` runs `npm run build` automatically on every commit. If the build fails, the commit is rejected. This is the enforcement mechanism for the "each commit must pass build" rule. If a commit is rejected:

1. Run `npm run build` manually to see the full error output
2. Fix the issue
3. Re-stage and commit again (do NOT amend — create a new commit)

## Recurring Cleanup (Between Tasks)

After completing each backlog item and before committing:

1. **Review staged changes** — `git diff --cached` to understand what changed
2. **Update steering docs if affected**:
   - `CLAUDE.md` — if new commands, patterns, or conventions were introduced
   - `checklist.md` — if new validation criteria are needed
   - `memory/MEMORY.md` — if key decisions were made
3. **Check for stale references** — removed components still imported? Dead code?
4. **Commit per task** — one logical commit per backlog item, referencing PF-XX

This is NOT optional. Treat it as part of the task definition of done.

## Cook Log Protocol

Cook log entries are the user's direct bake notes. The agent is a **scribe, not an author**.

### Agent Role: Format Only
- Structure raw notes into JSON (`notes[]`, `next_time[]`)
- Clean up grammar and punctuation
- **Never** infer details the user didn't state (brands, quantities, techniques)
- **Never** reword notes to change meaning or add specificity not provided
- **Never** add suggestions or recommendations as if the user said them
- If unsure about a detail, **ask** — wrong data is worse than missing data

### Clarify Loop (MANDATORY)

When the user provides cook log input (paste from notepad, dictation, etc.):

1. **Parse** — extract facts from the raw input, nothing more
2. **Clarify** — ask about anything ambiguous before writing JSON
   - "You mentioned mozzarella — which brand/type did you use this time?"
   - "You said the dough was hard to stretch — do you know how long the proof was?"
3. **Prompt for gaps** — if the log seems sparse, actively interview:
   - Check `next_time` items from previous bakes — "Did you try [X] from last session?"
   - Reference recipe stages — "How did the autolyse/knead/proof go?"
   - Ask about results — "How was the crumb? Flavor? Anything you'd change?"
4. **Echo back** — present the formatted notes for user approval before writing to JSON

### Why This Matters (the Mozzarella Rule)

The agent once wrote `"TJ's low-moisture mozzarella was too moist to shred"` when the user actually used HEB whole milk mozzarella. TJ's is what they *want* to use next time — not what they used. The agent inferred a brand and got it backwards. This produced incorrect cook log data that violated V1-V3 voice checks.

**One wrong detail poisons the whole entry.** Treat cook log input like a deposition — record what was said, clarify what's unclear, never embellish.

## Photo Pipeline

### Processing
1. Copy source photos to `photos-source/{recipe-id}/{date}/` with descriptive filenames
2. Run `npm run photos photos-source/{recipe-id}/{date}/`
3. Pipeline outputs 800w + 400w WebP to `public/images/{recipe-id}/{date}/`

### Hero Image Selection
- **Hero = last photo in the `photos` array** (CookLogSection renders it full-width)
- **Criteria**: Best in-frame shot of the finished product for that bake session
- **Gold standard**: ATK Cinnamon Buns Ultimate — `img-6729` (glazed buns, clean frame, good lighting)
- **Properties to match**: subject centered, finished product clearly visible, sharp focus, good color
- **Not hero material**: process shots, blurry action shots, cluttered backgrounds

### Review Workflow (until PF-90 automates this)
1. Process all photos through pipeline
2. Present numbered list to user with alt descriptions
3. User picks hero, excludes bad shots, reorders
4. Wire approved photos into cook_log JSON
5. Open recipe page for visual HITL review before commit

### Alt Text
- Descriptive, first-person context (what the photo shows in the bake)
- Include relevant details: equipment visible, technique shown, stage of process
- Example: "Finished pepperoni pizza on wire rack — cupped pepperoni, leopard-spotted char"

## Adding New Recipes
1. Create `public/recipes/your-recipe.json` following schema
2. Add entry to `public/recipes/index.json`
3. Run `/validate` to verify
