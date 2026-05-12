---
id: DRAFT-90
title: PricingView — units toggle + opt-in tracked recipes
status: Draft
assignee: []
created_date: '2026-05-12'
labels:
  - pricing
  - ui
  - followup
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255 HITL review (2026-05-12). Two gaps the user surfaced after slice 1 (PF-255.1) shipped.

### Gap 1 — Unit ambiguity

Today `/pricing` shows cost and sell price but doesn't say whether the price is for the whole recipe yield (8 cinnamon rolls), one item (1 roll), or one serving (1 slice of a loaf). User can't decide what to charge without that context.

Proposed:
- Toolbar toggle: `Per recipe / Per item / Per serving`. Switches cost + price + CP across all rows simultaneously.
- Each row labels its yield next to the recipe name (e.g., "ATK Cinnamon Buns Ultimate — 8 rolls").
- Resolution: `perItem = total / config.stats.defaultYield`; `perServing = perItem / config.stats.servingsPerItem` when present, else fall back to `total / nutrition.servings`.
- Recipes missing `defaultYield` or `servingsPerItem` should grey out the corresponding toggle option (links to backfill drafts 81/84).

### Gap 2 — Pick-and-choose (opt-in tracking)

Today every recipe renders a full row by default. User wants to start by pricing just a few recipes, not all 26.

Proposed:
- Extend `PricingProfile` with `tracked: Record<RecipeId, boolean>` (default empty = nothing tracked).
- Untracked rows collapse to a one-line `[+] Price this recipe — yields {X}` row.
- Clicking expands the row, sets `tracked[id] = true`, and reveals slider + price.
- Tracked rows show an inline `untrack` action that collapses back and clears the per-recipe overrides.
- Profile JSON export only includes tracked recipes' overrides (keeps the exported profile lean).

### Open decisions
- Default unit when toggle first loads: `per item` vs `per serving`. Recommend `per item` (closer to what the customer pays for a roll/loaf).
- When user untracks a row, do we keep the per-recipe override stashed (in case they re-track) or hard-clear? Recommend hard-clear with a confirm if values were non-default.
- Whether the existing `default.markupPct` still applies to collapsed/untracked rows. Recommend no — collapsed rows show no price at all.

### Scope flags
- Touches `src/types/pricing.ts` (add `tracked` field), `src/composables/usePricingProfile.ts` (resolve unit math + tracked state), `src/components/PricingView.vue` (toolbar + collapsed row variant), `src/components/PricingRow.vue` (unit-aware display).
- F43 (help tooltips) applies — the unit toggle, yield label, and "Price this recipe" CTA all need tooltips.
- Snapshot test for PricingRow needs updating with the new collapsed/expanded variants.
<!-- SECTION:DESCRIPTION:END -->
