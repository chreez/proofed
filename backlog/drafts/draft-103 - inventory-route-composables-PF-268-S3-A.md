---
id: DRAFT-103
title: /inventory route + composables (PF-268 S3-A)
status: Draft
assignee: []
created_date: '2026-05-14 20:32'
labels:
  - bakery-ops
  - inventory
  - route
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-268 design notes §2, §6, §7. Implement the /inventory lens: src/types/inventory.ts (InventoryItem, InventoryState, ShoppingListEntry, CanonicalIngredient, BulkTier per design §2), src/composables/useInventory.ts (localStorage CRUD on bake-inventory-current), src/composables/useShoppingList.ts (the pure rollup from design §6), src/lib/inventory.ts (pricePerGram + bulkBreakeven pure functions from §5), src/views/InventoryView.vue (three-column on-hand/planned/to-buy layout from §7). Wire route into router. Tooltips everywhere (F43). Provenance dots on derived numbers. Depends on DRAFT-102 (canonical catalog seed). No /pricing integration yet — that's S3-C.
<!-- SECTION:DESCRIPTION:END -->
