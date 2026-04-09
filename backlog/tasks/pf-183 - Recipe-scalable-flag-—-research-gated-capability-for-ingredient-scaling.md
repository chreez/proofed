---
id: PF-183
title: Recipe scalable flag — research-gated capability for ingredient scaling
status: To Do
assignee: []
created_date: '2026-04-08 21:10'
updated_date: '2026-04-08 22:10'
labels:
  - schema
  - scaling
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a `scalable` capability to the recipe schema that gates the recipe multiplier (PF-129). A recipe can only be marked scalable after research has documented which ingredients scale linearly, which don't, and what process changes scaling triggers (e.g., bulk fermentation tracked by rise % rather than clock for sourdough).

The flag is a recipe-level capability — applies to any recipe in `public/recipes/`. Existing recipes will need backfilling: each gets a research pass before its flag can be set.

Connects to:
- PF-129 (Recipe multiplier): the multiplier UI should only render on recipes where this flag is set
- Existing `Research` block pattern (top-level optional Recipe field) is the closest schema precedent
- `Confidence` enum already exists for ingredient provenance and could be reused

Open questions to resolve in grooming:
- Schema location and shape (top-level `Recipe.scaling` block vs `meta.scalable` boolean)
- Whether the block carries scale bounds (e.g., tested 1×–4×) or just yes/no
- Structure of research output (linear ingredients, non-linear caveats, process changes, source citations)
- Backfill scope — how many recipes seeded as part of this task vs follow-ups
- Whether this is a hard blocker for PF-129 or a parallel track
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A new `Scaling` interface is added to `src/types/recipe.ts` with fields: `tested_range: { min: number; max: number }`, `ingredients: ScalingIngredient[]`, `process_caveats: string[]`, `researched_date: string` (ISO date), `sources: string[]`
- [ ] #2 A new `ScalingIngredient` interface is added with fields: `id: string`, `behavior: 'linear' | 'non_linear' | 'fixed'`, `note?: string`
- [ ] #3 The `Recipe` interface gains an optional `scaling?: Scaling` field, sibling to `research`, `reheat`, and `nutrition`
- [ ] #4 `public/recipes/sourdough-pizza-dough.json` includes a populated `scaling` block with `tested_range: { min: 1, max: 2 }`, every gather-section ingredient classified by `behavior`, at least three `process_caveats` covering vessel size, fermentation tracked by rise % rather than clock, and bake sequencing, and at least two entries in `sources`
- [ ] #5 The recipe's `version` is bumped (minor) and a `change_log` entry summarizing the addition of the scaling block is added
- [ ] #6 A new check `S6` is added to `.claude/rules/validation/checklist.md` verifying that every `scaling.ingredients[].id` references an `id` that exists in the recipe's gather sections
- [ ] #7 A new check `S7` is added verifying that when `scaling` is present, `tested_range.min >= 1`, `tested_range.max >= tested_range.min`, `researched_date` is a valid ISO date, and `sources.length >= 1`
- [ ] #8 A new check `S8` is added verifying that recipes WITHOUT a `scaling` block do not render the multiplier control on their recipe page
- [ ] #9 The multiplier control renders in the recipe header area only when the recipe has a `scaling` block; otherwise the control is not present in the DOM
- [ ] #10 When the multiplier control is rendered, its selectable values span at least `tested_range.min` through `tested_range.max + 2` (so a 1×–2× recipe can still be pushed to 4× with a warning)
- [ ] #11 Selecting a multiplier value beyond `tested_range.max` displays a warning banner above the ingredients section stating the chosen value exceeds the tested range
- [ ] #12 When the active multiplier is greater than 1, the recipe page displays the `process_caveats` strings as a dismissible callout above the gather sections
- [ ] #13 When the active multiplier is greater than 1, every gather-section ingredient marked `behavior: 'non_linear'` or `behavior: 'fixed'` shows a visual indicator (badge or icon) next to its scaled amount, and hovering/tapping reveals the ingredient's `note`
- [ ] #14 Selecting a multiplier scales every `Ingredient.total`, every `IngredientBreakdown.amount`, every parsed numeric value inside `StateComponent.amount` strings, and the nutrition `totals` block by the chosen factor; `perServing` nutrition values remain unchanged
- [ ] #15 The `meta.yields` display reflects the scaled count where parseable (e.g., '2 pizzas' → '4 pizzas (×2)') and shows a multiplier badge when not parseable
- [ ] #16 The multiplier is display-only — no recipe JSON file is mutated. Resetting to 1× restores all values exactly as stored on disk
- [ ] #17 Six spike subtasks are created under this task, one per remaining baked recipe (Simple Sourdough, NY-Style Pizza Dough, Sourdough Cinnamon Buns, Birote Salado, ATK Ultimate Cinnamon Buns, Sourdough Cheddar Cheese Bread). Each spike is scoped to 'research scaling behavior + populate scaling block for {recipe name}' and references this parent task
- [ ] #18 The previously groomed recipe-multiplier task (PF-129) has its description and acceptance criteria updated to point to this task as the owner of the multiplier UI work, OR is closed with a redirect note. No multiplier UI scope exists in two places after grooming
- [ ] #19 `npm run build` passes (vitest + vue-tsc + vite build)
<!-- AC:END -->
