---
id: DRAFT-115
title: Multi-day bake timeline — "start by" calculation
status: Draft
assignee: []
created_date: '2026-05-19'
labels:
  - bakery-ops
  - pf-256
  - production
  - scheduler
dependencies:
  - DRAFT-112
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: 2026-05-19 market-workflow gap. Sourdough needs 36-48 hours. Once `bakeDate` exists (DRAFT-112), surface the implied "start mixing by Friday 7pm" so the user doesn't miss the window.

Lightweight precursor to PF-255.4 scheduler MVP — single-row inline calc rather than full drag-to-queue UI.

## Scope
- New helper `startBakeAt(entry, recipe): Date | null`:
  - Uses `recipe.meta.proof_passive_min + recipe.meta.oven_occupancy_min + recipe.meta.prep_active_min` (PF-267 fields).
  - Anchors on `bakeDate`: `startBakeAt = bakeDate - totalDuration`.
  - Returns null when `bakeDate` or timing fields missing.
- `/production` cart entry: inline "start: Fri 7pm" line below dates when timing data exists.
- Visual flag when `startBakeAt < now`: accent danger color + "should have started Xh ago".
- "Today's bake actions" mini-panel at top of `/production` (collapsed by default): summary of recipes that need to be started today across all queued entries.

## Proposed ACs
1. `startBakeAt(entry, recipe)` helper in `useProductionPlan` returns Date or null.
2. Cart entry shows "start: {weekday} {time}" when computable; HelpTooltip explains the calc.
3. Past-due entries render with danger accent + duration overdue message.
4. "Today's actions" collapsible panel lists entries whose `startBakeAt` falls within today's window.
5. Test coverage: full happy path (sourdough with all timing fields), missing timing fields (graceful null), past-due flagging.
<!-- SECTION:DESCRIPTION:END -->
