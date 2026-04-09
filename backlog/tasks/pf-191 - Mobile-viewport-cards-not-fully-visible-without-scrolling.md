---
id: PF-191
title: 'Mobile viewport: cards not fully visible without scrolling'
status: To Do
assignee: []
created_date: '2026-04-09 17:03'
updated_date: '2026-04-09 17:13'
labels:
  - bug (styling)
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On mobile, the recipe page requires pinch-to-zoom — one or more elements force the layout wider than `100vw`, causing horizontal overflow. Users can't read stage cards without zooming out.

## Scope
- Recipe page only (index and bake detail pages are separate if affected)
- Viewport/layout fix — not content readability (step ID naming is PF-189)

## Suspected areas
- `max-w-4xl` main container may not constrain children properly on narrow screens
- StageCard, StateStep, GatherSection components — no `overflow` or `max-width` constraints found
- StateStep has fixed-width table cells (`sn-th`, `sn-td`) and `white-space: nowrap` on headers
- Viewport meta tag is correct (`width=device-width, initial-scale=1.0`)

## Context
- Primary use is iPhone during baking — mobile is the critical viewport
- Container: `max-w-4xl mx-auto px-4` (896px + 32px padding)
- StageCard has an `overflow-hidden` div but only on the collapse transition wrapper
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe page has no horizontal overflow on mobile (no pinch-to-zoom, no horizontal scroll at 375px width)
- [ ] #2 Spike subtask: diagnose which element(s) force the page wider than viewport — inspect StageCard, StateStep, GatherSection, and the `max-w-4xl` container at mobile widths
- [ ] #3 All recipe page content fits within 100vw without clipping or horizontal scroll
- [ ] #4 Fix must not break desktop layout
- [ ] #5 HITL gate: mobile visual review on device required before commit
<!-- AC:END -->
