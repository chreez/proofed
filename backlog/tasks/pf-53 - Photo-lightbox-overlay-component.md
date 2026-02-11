---
id: PF-53
title: Photo lightbox overlay component
status: To Do
assignee: []
created_date: '2026-02-07 05:23'
updated_date: '2026-02-10 09:35'
labels:
  - feature
dependencies: []
priority: low
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace "open in new tab" with an in-page lightbox/overlay for viewing full-size cook log photos. Swipe/arrow navigation between photos in the same entry.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Clicking any cook log photo opens a full-viewport overlay instead of new tab
- [ ] #2 Overlay displays the 800w image with alt text as caption below
- [ ] #3 Left/right arrow keys (desktop) and swipe gestures (mobile) navigate between photos in same bake entry
- [ ] #4 Close via X button, Escape key, or tapping the backdrop
- [ ] #5 Photo index indicator visible (e.g. 2 / 5)
- [ ] #6 Body scroll locked while overlay is open
- [ ] #7 No external lightbox library — vanilla Vue component
- [ ] #8 HITL visual sign-off before commit
- [ ] #9 npm run build passes
<!-- AC:END -->
