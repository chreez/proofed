---
id: DRAFT-81
title: >-
  Backfill config.stats on 6 recipes (defaultYield, servingsPerItem, unit,
  servingUnit)
status: Draft
assignee: []
created_date: '2026-05-12 13:11'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spawned from PF-255.6 spike audit.

Add config.stats block to 6 recipes that are missing it:
- ba-bolognese → defaultYield 4, servingsPerItem 1, unit 'servings', servingUnit 'serving'
- jalapeno-cheddar-sourdough → FLAG for review: meta.yields says 2 loaves but nutrition.servings is 16 (mismatch — 8/loaf or 10/loaf?)
- sourdough-chocolate-chip-cookies → defaultYield 23 (matches nutrition.servings), servingsPerItem 1, unit 'cookies'
- sourdough-discard-cheese-crackers → defaultYield ~90 (estimate from '80-100'), servingsPerItem 1
- tartine-lemon-cream-tart → defaultYield 12, servingsPerItem 1, unit 'tartlets'
- tartine-rugelach → defaultYield 16, servingsPerItem 1, unit 'rugelach'

All values derivable from existing meta.yields strings (no human input needed except the jalapeno-cheddar mismatch).

Why needed: PF-255.1 pricing slice needs defaultYield + servingsPerItem to compute per-unit and per-serving prices.

Audit detail: backlog/tasks/pf-255.6-spike-notes.md section 2B.

Priority: Medium.
<!-- SECTION:DESCRIPTION:END -->
