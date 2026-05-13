---
id: DRAFT-91
title: Ingredient inventory + stock purchase planning
status: Draft
assignee: []
created_date: '2026-05-12'
labels:
  - bakery-ops
  - inventory
  - pricing-adjacent
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255 rework clarify loop (2026-05-12). User intent for /pricing isn't pure markup — it's a bakery-ops surface, of which inventory is a pillar.

Roll up ingredient usage across all recipes (or all *queued* recipes) → produce a shopping list. Surface shared ingredients (flour, butter, eggs) so bulk purchases can be planned against forecasted demand. Tie into pricing via bulk-amortization (the cheaper per-gram price unlocks once you commit to bulk).

Adjacent to DRAFT-23 (true cost calculator) but inventory-focused, not utility-focused.

Scope flags (large — needs grooming):
- Ingredient identity dedup across recipes (flour ≠ flour ≠ all-purpose vs bread)
- "What do I already have" inventory state (manual entry vs scanned)
- "What do I need to buy" diff (planned bakes minus on-hand)
- Bulk-tier pricing (HEB sells AP flour in 5lb, 25lb, 50lb sacks at different per-gram)
- Expiry tracking for perishables (eggs, butter)
- Integration point for /pricing's CP: when bulk is unlocked, cost per gram drops → CP rises
<!-- SECTION:DESCRIPTION:END -->
