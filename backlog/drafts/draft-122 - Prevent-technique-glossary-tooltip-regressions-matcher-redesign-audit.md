---
id: DRAFT-122
title: Prevent technique-glossary tooltip regressions (matcher redesign + audit)
status: Draft
assignee: []
created_date: '2026-07-04 20:01'
labels:
  - ungroomed
  - spike
  - ux
  - tech-debt
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Problem

The technique glossary (`public/techniques.json` + `src/composables/useTechniques.ts`) uses **case-insensitive substring matching** to find tooltip triggers in ingredient names and state directions. This produces cross-contamination:

### Concrete failures observed (2026-07-04, jalapeño cheddar sourdough)

1. **Butter ingredient shows egg tooltip.** `Unsalted Butter (room temp)` matches the `"room temp"` key, whose tooltip is "Room Temperature Eggs — place eggs in warm water for 5-10 minutes..." Wrong ingredient context.
2. **Process-state directions misfire.** 28 recipes have direction text like "let dough rest at room temperature" — because "room temp" is a substring of "room temperature", the eggs tooltip triggers on every rest-state description. Structural false positive.
3. **Other ingredient-specific keys** (`softened`, `melted`, `diced`, `sifted`, `warm to 43°C`, `bloomed`) may also misfire when the same descriptor is used across differently-typed ingredients (e.g., "melted" for coconut oil vs butter).

### Immediate workaround shipped

Renamed jalapeño cheddar butter to `(softened)` so it matches the existing correct `softened` tooltip. Point fix — does not address root cause or protect other recipes.

## Ask

Design a matcher + data-shape approach that prevents these false positives structurally, not by playing whack-a-mole with parenthetical names. Then plan the sweep to migrate existing recipes onto the new system.

## Design questions (for spike)

1. **Matcher scope.** Should tooltips only match on ingredient names, or should they also decorate direction/exit_condition text? If both, should the matcher have different rules per context?
2. **Disambiguation mechanism.** Options to consider:
   - Explicit annotation: add `technique_hint: "softened-butter"` field to `IngredientRow`, matcher consumes only the hint. No substring fallback.
   - Word-boundary matching: change matcher to `\b<keyword>\b` regex. Fixes "room temp" ⊂ "room temperature" but does NOT fix ingredient-context mismatches (butter vs eggs, both plausible for "room temp").
   - Scoped keys: change glossary keys to ingredient-qualified phrases ("room temp butter", "room temp eggs") and require exact substring. Requires renaming ingredient patterns.
   - Hybrid: annotation-first with word-boundary fallback for state text.
3. **Ingredient names as UX vs identifier.** Current recipes bake tooltip triggers into human-readable names via parentheticals. Should we separate them?
4. **Backwards compat.** Historical `change_log[].ingredients` and `cook_log[].ingredients` snapshots are frozen. Any migration must NOT touch them. Only current `stages[].gather.ingredients[]` renames get patch-bumped.

## Prevention (test / audit tooling)

5. **Regression test.** Add a test that fails if any ingredient/direction/exit_condition string in `public/recipes/*.json` matches a technique key that mentions a different ingredient in its title/description (e.g., butter row matching an eggs-titled tooltip).
6. **Cross-recipe audit script.** `scripts/audit-techniques.ts` — enumerates every technique-key match across every recipe field, groups by <recipe, ingredient, matched-key, tooltip-title> and flags mismatches. Runnable as `npm run audit:techniques`.
7. **Test fixture for technique matcher.** Extend `useTechniques.spec.ts` with cases for "room temperature" (should NOT match "room temp" key under new rules), "softened butter", "softened cream cheese", "melted butter" vs "melted coconut oil" (once identified), etc.

## Deliverables (from spike)

- Written recommendation on matcher approach (annotation, word-boundary, scoped keys, or hybrid) with pros/cons and blast radius estimate
- Draft ACs for implementation task(s) that follow
- List of ingredient/direction strings requiring rename or annotation across the 28 affected recipes
- Draft ACs for regression-prevention tooling (script + tests)

## Follow-up tasks (to draft after spike lands)

- Implement chosen matcher approach
- Apply ingredient/direction migrations recipe-by-recipe (patch bumps per recipe)
- Ship audit script + regression tests

## Source

- Bake log 2026-06-27 (jalapeño cheddar) → next_time item on missing butter → grooming session revealed tooltip misfire
- Jalapeño cheddar v3.0.1 patch shipped a point fix (butter renamed to `(softened)`) — this draft addresses the root cause and prevents recurrence
<!-- SECTION:DESCRIPTION:END -->
