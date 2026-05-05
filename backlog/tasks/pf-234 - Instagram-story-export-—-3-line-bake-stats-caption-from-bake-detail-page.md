---
id: PF-234
title: Instagram story export — 3-line bake stats caption from bake detail page
status: To Do
assignee: []
created_date: '2026-05-05 21:10'
updated_date: '2026-05-05 21:16'
labels:
  - ux
  - export
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Share button on bake detail page (`/recipe/:id/bake/:date`) copies a 3-line plain-text caption to clipboard for posting to Instagram story.

## Format

```
L1: {daysBaked} days baked · {percent}% of {totalDays} days since first bake
L2: {cals} cals · {typeCounts} · ${lifetimeSpend} lifetime
L3: {recipeBakeCount} bakes of {recipeName}{ · outcome}{ · $thisCost}{ · servings servings}
```

## Workflow

Click Share → optional 'Rate this bake' step (failure / meh / mid / success / skip) → confirm/copy. Outcome write-back to cook_log entry on recipe JSON when picked.

## Source

- Lifetime metrics (L1, L2): aggregate across every recipe's cook_log
- Current bake metrics (L3): this entry + parent recipe context

## Pattern reference

Inspired by guitar-stats pattern (contiguous days + cadence). 'Time since last check-in' dropped — bake posting is photo-based, not check-in-based.

## Open: type-counts format

L2 `typeCounts` (e.g. 'x pizzas, x sourdough') format TBD — see spike subtask.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Bake detail page (/recipe/:id/bake/:date) renders a Share button colocated with existing Print and QR buttons, using share or instagram icon from existing icon set
- [ ] #2 Click opens a small workflow with an optional 'Rate this bake' step (options: failure | meh | mid | success | skip), then a confirm/copy step
- [ ] #3 Final action copies a 3-line plain-text caption to clipboard via shared copyToClipboard from useClipboard.ts (per F28). No image generation, no canvas/html-to-image dependency
- [ ] #4 Line 1 (lifetime cadence, all recipes): '{daysBaked} days baked · {percent}% of {totalDays} days since first bake' — daysBaked = unique ISO dates with ≥1 cook_log entry (normal + aberration), totalDays = days from earliest cook_log date through today inclusive, percent = round(daysBaked / totalDays * 100)
- [ ] #5 Line 2 (lifetime totals, all recipes): '{cals} cals · {typeCounts} · ${lifetimeSpend} lifetime' — cals formatted via existing formatCaloriesK (recipes without nutrition silently skipped, matches StatsPage); lifetimeSpend = sum of cook_log[].cost.total across all recipes (matches Pantry Ledger total), formatted $X.XX
- [ ] #6 Line 3 (current bake, this recipe): '{recipeBakeCount} bakes of {recipeName}{ · outcome}{ · $thisCost}{ · servings servings}' — recipeBakeCount = total completed non-aberration cook_log entries for current recipe; recipeName = recipe.meta.name; outcome segment omitted entirely if user skipped; thisCost segment omitted if entry has no cost; servings segment omitted if actual_yield or stats.servingsPerItem missing
- [ ] #7 New optional field on CookLogEntry for outcome with type 'failure' | 'meh' | 'mid' | 'success'. Field is written ONLY when user picks an outcome (skip leaves field absent)
- [ ] #8 When outcome is picked, the choice is persisted to the recipe JSON cook_log entry. Re-opening export on the same entry pre-selects the prior outcome
- [ ] #9 Export remains available even if recipe lacks config.stats, nutrition data, or cost data — affected line segments degrade gracefully (omit), never crash
- [ ] #10 Recipe JSON changes from outcome write-back follow existing version protocol — minor version bump + change_log entry
- [ ] #11 Spike subtask PF-234.1 demos visual variants for Line 2 typeCounts formatting (top-N truncation, all-groups, abbreviated forms). Implementer picks format after demo review and updates this AC list with chosen format before shipping
<!-- AC:END -->
