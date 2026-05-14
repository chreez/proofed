---
id: DRAFT-106
title: Bulk-tier price refresh in /cost skill
status: Draft
assignee: []
created_date: '2026-05-14 20:32'
labels:
  - bakery-ops
  - inventory
  - cost
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-268 design notes §12. Extend the existing /cost skill so it also refreshes catalog[].bulkTiers when running an HEB price refresh. Look up 5/25/50 lb sacks for flour, 1/4 lb butter, 12/18/60 ct eggs, etc., and write tier entries into public/ingredients/catalog.json with sourceProduct, price, sizeGrams, ratePerGram. Same updatedAt cadence as cost-rates.json. Depends on DRAFT-102 (canonical catalog seed).
<!-- SECTION:DESCRIPTION:END -->
