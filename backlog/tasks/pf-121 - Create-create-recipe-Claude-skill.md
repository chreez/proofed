---
id: PF-121
title: Create /create-recipe Claude skill
status: Done
assignee: []
created_date: '2026-02-11 21:11'
updated_date: '2026-02-11 21:41'
labels:
  - skill
  - dx
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Formalize the recipe JSON creation process into a reusable Claude skill (`/create-recipe`), similar to how `/research` codifies multi-agent research. The skill should encode every step needed to go from a research synthesis (or raw recipe) to a fully wired-up recipe in the app, so nothing gets missed (like the categoryMap entry).

Covers: recipe JSON creation from synthesis/source, index.json manifest entry, RecipeIndex categoryMap entry, nutrition block, validation gate, original-recipes.md source preservation (when applicable).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skill file exists at `.claude/skills/create-recipe/SKILL.md` with valid frontmatter (name, description, user-invocable, allowed-tools, argument-hint)
- [x] #2 Two entry paths documented: (A) research synthesis — takes `photos-source/{id}/research/` path, (B) raw source — user pastes or points to original recipe text
- [x] #3 Recipe ID generation — skill confirms kebab-case ID with user before creating any files
- [x] #4 Recipe JSON creation — `public/recipes/{id}.json` matching `Recipe` type in `src/types/recipe.ts`, with all D1-D9, D12, D14 checks encoded as step reminders
- [x] #5 Index manifest — entry added to `public/recipes/index.json`
- [x] #6 Category assignment — skill reads current `categoryMap` from `RecipeIndex.vue`, presents existing categories for user to pick; only suggests a new category if recipe clearly doesn't fit any existing one (not for one-offs)
- [x] #7 Source preservation — for raw source path (B), original recipe text saved to `.claude/rules/validation/original-recipes.md` or `photos-source/{id}/source/`
- [x] #8 Nutrition subtask — always creates a PF-XX.1 nutrition subtask (never calculates inline)
- [x] #9 Build gate — `npm run build` must pass before skill completes
- [x] #10 Validation gate — skill runs or reminds to run `/validate` after creation
- [x] #11 HITL review — skill presents the complete recipe JSON for user approval before writing to disk
- [x] #12 Skill is user-invocable — callable via `/create-recipe <id-or-subject>`
- [x] #13 Cross-skill awareness — `/research` SKILL.md updated to mention `/create-recipe` as the natural next step after synthesis approval
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Skill file created at `.claude/skills/create-recipe/SKILL.md` — 522 lines covering 7 phases:
1. Input & ID Confirmation (two entry paths)
2. Source Preservation (4 source types)
3. Recipe JSON Assembly (full Recipe interface walkthrough with D1-D9, D12, D14 reminders)
4. HITL Review (breakdown sum verification table)
5. Wiring (JSON + index.json + categoryMap)
6. Nutrition Subtask (always created, never inline)
7. Gates (build + validate)

Research SKILL.md updated in two places for cross-skill awareness (line 187: primary recommendation, line 221: notes section).
<!-- SECTION:NOTES:END -->
