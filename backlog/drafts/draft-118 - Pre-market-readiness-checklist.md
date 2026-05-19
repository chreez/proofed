---
id: DRAFT-118
title: Pre-market readiness checklist
status: Draft
assignee: []
created_date: '2026-05-19'
labels:
  - bakery-ops
  - pf-256
  - new-lens
dependencies:
  - DRAFT-112
  - DRAFT-113
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: 2026-05-19 market-workflow gap. The "pack the car" moment has no surface. Need a single page that gates "ready to sell" with a checklist of derived state + user toggles.

## Scope
- New `/checklist` route or modal accessed from `/sales` empty state ("Start market session" with a "Run checklist first" link).
- Derived items (auto-checked when conditions met):
  - All queued production entries have `bakeDate ≤ today` (DRAFT-112)
  - Labels printed (track via localStorage flag set when /labels print button clicked)
  - No active session currently open (gate against double-booking)
- User-toggleable items:
  - Cash float prepared (default suggestion $50 in small bills)
  - Inventory packed (each queued recipe gets a row + check)
  - Notes from last market reviewed (link to most recent closed session)
- "Ready to sell" CTA visible only when all critical items are checked; opens new session.

## Proposed ACs
1. New `/checklist` route registered.
2. ChecklistView component lists derived + user items; renders per-item check state + click toggle.
3. Derived items pull from: ProductionPlan (bakeDate), localStorage "labels-printed" flag, useSales active session presence.
4. "Labels Printed" flag set by LabelsView's print button (extend that surface).
5. User checks persist per-day in localStorage (so re-opening shows current state).
6. "Ready to sell" button gates `openSession` flow; disabled state hint explains what's missing.
7. F43 tooltips on every item; F27 useSeoMeta with 'Checklist · proofed.'
8. Snapshot test for ready vs not-ready states.
<!-- SECTION:DESCRIPTION:END -->
