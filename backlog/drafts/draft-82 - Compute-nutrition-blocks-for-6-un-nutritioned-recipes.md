---
id: DRAFT-82
title: Compute nutrition blocks for 6 un-nutritioned recipes
status: Draft
assignee: []
created_date: '2026-05-12 13:11'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spawned from PF-255.6 spike audit.

Compute and write nutrition block on 6 recipes currently missing it:
- candida-focaccia
- grain-free-bread
- potato-buns
- sourdough-discard-cheese-crackers
- sourdough-pizza-dough
- tartine-rugelach

All 6 already have full stages[].gather.ingredients[] with gram amounts → USDA FDC lookups should be straightforward. No new data needed.

This is also a known D16 / F17-F22 validation requirement (checklist).

Why needed: PF-255 pricing UI wants per-serving cost vs per-serving calorie comparison.

Audit detail: backlog/tasks/pf-255.6-spike-notes.md section 2C.

Priority: Medium.
<!-- SECTION:DESCRIPTION:END -->
