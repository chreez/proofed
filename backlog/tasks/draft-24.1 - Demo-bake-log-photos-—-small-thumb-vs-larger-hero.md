---
id: DRAFT-24.1
title: 'Demo: bake log photos — small thumb vs larger hero'
status: Done
assignee: []
created_date: '2026-02-20 18:55'
updated_date: '2026-02-21 00:47'
labels:
  - spike
  - ux
dependencies: []
parent_task_id: DRAFT-24
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Throwaway demo page showing the bake log timeline with two photo treatments side-by-side:\n\n**Option A — Small thumbnail (80x80)**\nMatches the existing CookLogSection collapsed pattern. Photo sits left of the text, same height as the entry.\n\n**Option B — Larger hero (~160px tall)**\nMore prominent image that makes the timeline feel visual/gallery-like. Could sit above or beside the text.\n\nUse real bake data from existing recipes (ny-style-pizza, sourdough-cinnamon-buns have photos). Show entries both with and without photos to verify mixed-content behavior.\n\nDemo page route: /demo/bake-log-photos
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Demo page at `/demo/bake-log-photos` shows two side-by-side timeline columns: Option A (small thumb ~80px) and Option B (larger hero ~160px)
- [x] #2 Both columns render real bake data fetched from recipe JSONs (ny-style-pizza, sourdough-cinnamon-buns, simple-sourdough)
- [x] #3 Entries with photos show hero thumbnail (last photo in array); entries without photos render cleanly with no broken layout
- [x] #4 Timeline spine/dot styling matches existing BakeLogPage pattern
- [x] #5 Page is throwaway — no router link from nav, accessible only by direct URL
- [x] #6 HITL gate — user reviews on desktop + mobile before any commit
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User reviewed both options and chose **Option A (compact thumb ~80px)**. Feed this into parent DRAFT-24 ACs when grooming the implementation task.
<!-- SECTION:NOTES:END -->
