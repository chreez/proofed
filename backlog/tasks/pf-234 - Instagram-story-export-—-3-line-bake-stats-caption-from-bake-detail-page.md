---
id: PF-234
title: Instagram story export — 3-line bake stats caption from bake detail page
status: Done
assignee: []
created_date: '2026-05-05 21:10'
updated_date: '2026-05-05 22:42'
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
- [ ] #4 New optional field on CookLogEntry for outcome with type 'failure' | 'meh' | 'mid' | 'success'. Field is written ONLY when user picks an outcome (skip leaves field absent)
- [ ] #5 Export remains available even if recipe lacks config.stats, nutrition data, or cost data — affected line segments degrade gracefully (omit), never crash
- [ ] #6 Line 2 typeCounts format: '{count}{icon} {count}{icon} {count}{icon}' using GROUP_ICONS map (mirror StatsPage.vue lines 69-78). Skip 'Aberrations' group. Order by count DESC. Example: '22🍞 10🧁 6🍕'
- [ ] #7 Workflow UI shape: bottom sheet — slides up from viewport bottom, 2-col rate grid, full-width Copy button. Mobile-first.
- [ ] #8 Outcome segment renders as emoji + label: '✅ success' | '😐 mid' | '👎 meh' | '💥 failure'. Emoji prefix only (no 'result:' or 'outcome:' word). Whole segment dropped if outcome missing/skipped.
- [ ] #9 BakeScratchpad type (src/types/recipe.ts) gets new optional 'outcome' field of type 'failure' | 'meh' | 'mid' | 'success'. Future /bake-log skill captures it at scratchpad → cook_log harvest time (out of scope here)
- [ ] #10 At export, outcome resolution: (1) cook_log entry.outcome → use it, skip rate step; (2) scratchpad.outcome (if a scratchpad exists for this bake) → use it; (3) neither → show rate step in bottom sheet. The dialog pick is transient — used ONLY in the clipboard string, no localStorage, no JSON write
- [ ] #11 Add F-row to checklist.md feature-specific section documenting this share/export feature
- [ ] #12 Line 1 (lifetime cadence, all recipes): items joined by tab (\\t) — '{daysBaked} days baked\\t{percent}% of {totalDays} days since first bake' — daysBaked = unique ISO dates with ≥1 cook_log entry (normal + aberration), totalDays = days from earliest cook_log date through today inclusive, percent = round(daysBaked / totalDays * 100)
- [ ] #13 Line 2 (lifetime totals, all recipes): items joined by tab (\\t) — '{cals} cals\\t{typeCounts}\\t${lifetimeSpend} lifetime' — cals via formatCaloriesK, lifetimeSpend = sum of cook_log[].cost.total across all recipes (matches Pantry Ledger total), formatted $X.XX. typeCounts segment dropped if no groups
- [ ] #14 Line 3 (current bake): items joined by tab (\\t) — '{recipeBakeCount} bakes of {recipeName}{\\toutcome}{\\t$thisCost}{\\tservings servings}' — recipeBakeCount = total non-aberration completed cook_log entries; segments after recipeName drop independently when their data is missing
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Shipped. Bottom sheet on bake detail page next to Print + QR. Tab-separated 3-line caption with emoji-prefixed outcome (✅😐👎💥) and money-bag (💰) cost segments. Outcome resolution: entry.outcome → scratchpad.outcome → dialog. Per-item cost rendered as 'X total (Y/loaf)' using config.stats.unit (singularized). New optional fields: CookLogEntry.outcome, BakeScratchpad.outcome. Future: /bake-log skill should capture scratchpad.outcome (separate task).
<!-- SECTION:NOTES:END -->
