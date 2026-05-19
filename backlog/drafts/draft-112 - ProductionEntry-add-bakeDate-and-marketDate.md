---
id: DRAFT-112
title: ProductionEntry — add bakeDate + marketDate
status: Draft
assignee: []
created_date: '2026-05-19'
labels:
  - bakery-ops
  - pf-256
  - production
  - foundational
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: 2026-05-19 market-workflow gap review. `/production` is currently a wishlist — entries have no date. Without dates the labels stamp today, no schedule context exists, and "for this Saturday's market" can't be expressed. Foundational for DRAFT-113 (label dates), DRAFT-114 (demand forecast), DRAFT-115 (multi-day timeline).

## Scope
- Extend `ProductionEntry` with `bakeDate?: string` (ISO `YYYY-MM-DD`) and `marketDate?: string` (ISO `YYYY-MM-DD`).
- `/production` cart entry: two compact date inputs (or one combined picker) with sensible defaults.
- Sort/group active queue by `marketDate` ascending, with an "Upcoming" / "Unscheduled" split if any entries have null dates.
- Reverse-calc convenience: setting `marketDate` auto-suggests a `bakeDate` from `recipe.meta.proof_passive_min + oven_occupancy_min` (clamps to ≥1 day before market).
- Backwards-compat: existing entries in localStorage with no dates render in "Unscheduled" section; user can backfill or leave null.

## Proposed ACs
1. `ProductionEntry` gains `bakeDate?` + `marketDate?` (ISO `YYYY-MM-DD` strings, both optional).
2. Cart entry renders two date inputs (or a single popover) with HelpTooltip explaining each.
3. Default for new entry: `marketDate = next Saturday`, `bakeDate = marketDate - 1 day` (sourdough sensible default).
4. Reverse-calc helper: changing `marketDate` proposes new `bakeDate` based on recipe throughput timing; user can accept or override.
5. Queue groups: "Upcoming markets" (entries with `marketDate`) sorted ascending; "Unscheduled" (null) at bottom.
6. Snapshot test for the new entry shape; localStorage migration is a no-op (fields are optional).
7. `useProductionPlan` test coverage for date helpers (sorting, defaulting, reverse-calc).
<!-- SECTION:DESCRIPTION:END -->
