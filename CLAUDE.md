# Bake Workflow Project

JSON-first recipe workflow system. Swap data, not code.

## Tech Stack
- Vite + Vue 3 (Composition API) + TypeScript
- UnoCSS with warm stone palette
- Recipes as JSON in `public/recipes/`

## Commands
- `npm run dev` - Start dev server at http://localhost:5173
- `npm run build` - Type-check and build for production

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
- Temperatures in **Celsius** with Fahrenheit in parentheses
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

## Task Management (backlog.md)
- Tasks live in `backlog/tasks/` as markdown files — **never edit directly**
- Use CLI: `backlog task create`, `backlog task edit`, `backlog task list`
- Use `--plain` flag when agents read tasks
- Board view: `backlog board` (terminal) or `backlog browser` (web)
- Task prefix: `pf` (e.g., PF-1, PF-2)
- MCP server available: tools like `task_list`, `task_create`, `task_view`

## Git Commit Convention

- **One logical change per commit** — don't mix features, bugs, or refactors
- **Each commit must pass `npm run build`** (tests + type-check + build)
- **Reference backlog task ID** when applicable: `fix: header padding (PF-17)`
- **Commit between backlog items** — don't batch multiple tasks into one commit
- **Message format**: `<type>: <description> (PF-XX)`
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
  - Keep description concise, lowercase, imperative mood
- **Examples**:
  - `feat: add version to recipe title (PF-18)`
  - `fix: remove extra padding on card-title (PF-17)`
  - `chore: remove unused TocPill component`
  - `test: add StageCard header styling tests`

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

## Adding New Recipes
1. Create `public/recipes/your-recipe.json` following schema
2. Add entry to `public/recipes/index.json`
3. Run `/validate` to verify
