---
id: PF-156
title: Add hero photos to bake log timeline page
status: Done
assignee: []
created_date: '2026-02-20 17:30'
updated_date: '2026-02-21 06:17'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add hero photo thumbnails to the bake log timeline page (/bake-log). Entries with photos show a compact ~80px thumb (hero = last photo in array) to the left of the text content, matching the CookLogSection collapsed card pattern. Entries without photos render text-only with no broken layout.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 BakeLogPage fetches cook_log photo data (currently stripped out of BakeEntry interface)
- [x] #2 Entries with photos show an ~80x80 hero thumbnail (last photo in array) to the left of text content
- [x] #3 Entries without photos render text-only — no placeholder, no broken layout, no shift
- [x] #4 Thumbnail has 2px stone-200 border, 0 border-radius (matching brand spec)
- [x] #5 Timeline spine/dot layout remains intact with photos present
- [x] #6 Mobile: thumb shrinks gracefully or stacks appropriately on narrow viewports
- [x] #7 Clicking a timeline entry still navigates to the bake detail page (existing behavior preserved)
- [x] #8 Uses latestCookLogEntryWithPhotos or equivalent — does not show stale/missing photos from in-progress entries
- [x] #9 HITL gate — human sign-off before commit
- [x] #10 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Demo outcome (DRAFT-24.1):** User chose **Option A — compact thumb (~80px)** over larger hero. Photo sits left of text content, matching the CookLogSection collapsed pattern. Next step: groom DRAFT-24 with ACs based on this direction.
<!-- SECTION:NOTES:END -->
