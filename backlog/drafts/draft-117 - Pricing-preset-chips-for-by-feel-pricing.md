---
id: DRAFT-117
title: /pricing — preset chips for by-feel pricing
status: Draft
assignee: []
created_date: '2026-05-19'
labels:
  - bakery-ops
  - pf-256
  - pricing
  - ux
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: 2026-05-19 market-workflow gap. Pricing override (double-click → type → Enter) is slow when iterating "$10 then maybe $12." Add preset chips that snap to common price points.

## Scope
- `/pricing` row gains a chip row below or beside the sell price: `[$5] [$8] [$10] [$12] [$15] [$20]` (default set; eventually configurable per-recipe).
- Chips computed from cost: show 4-6 nearest "round" prices starting at `cost × 2` rounded up to nearest $1 or $5, depending on price range.
- Tapping a chip sets `sellPriceOverride` to that value.
- Currently-selected chip (whose value matches the current override) renders with accent fill.
- Tapping the already-selected chip clears the override (returns to markup-driven price).
- Custom override via double-click still works.

## Proposed ACs
1. Pricing row shows 4-6 preset chips below the sell price.
2. Chip values computed from cost: e.g., cost $1.27 → chips [$5, $8, $10, $12, $15, $20]; cost $0.50 → chips [$2, $3, $5, $8, $10, $15].
3. Tapping a chip sets `sellPriceOverride` to that value.
4. Active chip (matches current override) highlighted with accent.
5. Tap-active-chip-again clears override.
6. Custom override (double-click) unaffected.
7. F43 tooltip on each chip explaining the markup% it implies for that cost.
8. ≥6 tests covering chip computation across cost ranges, selection state, clear-on-toggle.
<!-- SECTION:DESCRIPTION:END -->
