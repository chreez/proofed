---
id: PF-110
title: Fix lightbox opening at end of queue when clicking hero image
status: In Progress
assignee: []
created_date: '2026-02-11 03:23'
updated_date: '2026-02-11 03:29'
labels:
  - bug (ux)
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Clicking the cook log hero image opens the lightbox at the last index (hero = last in array by convention), forcing the user to navigate backwards. Hero click should open at index 0 so browsing goes forward through the gallery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Clicking hero image in CookLogSection opens lightbox at index 0 (first photo), not the hero's array position
- [ ] #2 Clicking a thumbnail in the photo strip still opens at that photo's index (existing behavior preserved)
- [ ] #3 Arrow/swipe navigation works correctly from index 0
- [ ] #4 npm run build passes
<!-- AC:END -->
