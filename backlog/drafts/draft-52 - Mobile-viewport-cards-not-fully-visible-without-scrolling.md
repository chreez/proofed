---
id: DRAFT-52
title: 'Mobile viewport: cards not fully visible without scrolling'
status: Draft
assignee: []
created_date: '2026-04-09 17:03'
labels:
  - bug (styling)
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On mobile, recipe stage cards are not fully visible in the viewport by default — users have to scroll to see the full card content. The readability and notation is also confusing (e.g., `FOLD_3` instead of human-readable titles).

## Needs diagnosis
- Which cards/components are clipped? StageCard, GatherSection, or the overall page layout?
- Is this a padding/margin issue, a card height issue, or a viewport height calculation issue?
- Does it affect all recipes or just ones with many stages/long content?
- Is this related to the iOS Safari viewport bug (address bar height)?

## Note
The step ID readability issue (`FOLD_3`) is covered by PF-189. This task should focus on the viewport/visibility problem only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spike: diagnose which components are clipped on mobile and identify root cause
- [ ] #2 Each card should be fully readable in the viewport without unexpected clipping
- [ ] #3 HITL gate: mobile visual review required before commit
<!-- AC:END -->
