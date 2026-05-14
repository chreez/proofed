---
id: PF-268
title: Ingredient inventory + stock purchase planning
status: To Do
assignee: []
created_date: '2026-05-12'
updated_date: '2026-05-14 20:29'
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Design doc exists at backlog/tasks/pf-268-design-notes.md covering data shapes, identity dedup, bulk-tier model, expiry, /inventory lens UX, and integration with /pricing.
- [ ] #2 Ingredient identity dedup approach defined: canonical catalog (public/ingredients/catalog.json) with alias map; reuses cost-rates.json key conventions; documents merge strategy for AP vs bread vs whole-wheat flour and other 'looks-the-same-but-priced-differently' pairs.
- [ ] #3 On-hand inventory state spec written: TS shape (InventoryItem with canonicalId, amountGrams, openedAt?, expiresAt?, lotPrice?, lotSizeGrams?, source), localStorage key bake-inventory-current, manual entry MVP + future barcode/scan hook called out as deferred.
- [ ] #4 Diff calc spec written: rollup(planned recipes × ingredient amounts) - onHand grouped by canonicalId → ShoppingListEntry[]; covers multiplier handling, batches × baseYield, and ingredient-snapshot precedence (cook_log → change_log → gather defaults).
- [ ] #5 Bulk-tier pricing model documented: BulkTier shape (sizeGrams, price, ratePerGram, perishabilityRiskDays?), pricePerGram(weight, tiers) and bulkBreakeven(bulkCost, perGramSavings, projectedUseGramsPerWeek) signatures, worked example with AP flour 5/25/50 lb.
- [ ] #6 Expiry tracking spec for perishables: eggs, butter, dairy carry default shelf-life days in catalog; InventoryItem.expiresAt computed at purchase; /inventory surfaces 'expiring soon' (≤7 days) badge; expired items excluded from on-hand subtraction.
- [ ] #7 Integration spec: how /pricing's CP changes when bulk is unlocked — selected BulkTier overrides cost-rates.json ratePerGram for that ingredient; provenance tagged 'bulk' so the lens shows 'unlocked' state; cost factor stack (PF-256) unaffected for non-bulk items.
- [ ] #8 Open decisions captured in the design doc's 'Open Questions' section with reasonable defaults documented so executor isn't blocked.
- [ ] #9 User signs off on the design doc before this task moves to Done; spawned follow-up drafts (catalog seed, /inventory route, agent skill) are listed on this task.
<!-- AC:END -->

## Implementation Notes

Design doc: `backlog/tasks/pf-268-design-notes.md`

Parent epic: PF-256 (Bakery Ops Assistant, Slice S3).

Spawned follow-up drafts (sequential dependency chain):

- DRAFT-102 — Build ingredient canonical catalog seed
- DRAFT-103 — /inventory route + composables (S3-A) — depends on 102
- DRAFT-104 — /inventory agent skill — depends on 103
- DRAFT-105 — Bake-log → inventory depletion hook — depends on 104
- DRAFT-106 — Bulk-tier price refresh in /cost skill — depends on 102
- DRAFT-111 — /pricing CP integration with bulk overrides (S3-C) — depends on 103 + 104

Open questions in design doc §10 have reasonable defaults (HEB-only catalog,
weekly cadence derived from cook_log, single-user localStorage, no
reconciliation prompts in MVP). User can override any during execution
kickoff.
