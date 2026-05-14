---
id: DRAFT-105
title: Bake-log → inventory depletion hook
status: Draft
assignee: []
created_date: '2026-05-14 20:32'
labels:
  - bakery-ops
  - inventory
  - bake-log
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-268 design notes §9. At cook_log entry write time, the /bake-log skill should call inventoryDeplete() for every ingredient consumed during the bake, using the cook_log[].ingredients snapshot (PF-237) for canonical amounts. Adds provenance trace so the user can see 'used 487g AP flour for this bake' tied back to the inventory row. Should be idempotent (re-running /bake-log doesn't double-deplete). Depends on DRAFT-104 (/inventory skill).
<!-- SECTION:DESCRIPTION:END -->
