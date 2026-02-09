---
id: PF-4.8
title: Cook log photo gallery styling and layout
status: To Do
assignee: []
created_date: '2026-02-07 05:32'
updated_date: '2026-02-09 22:55'
labels:
  - ux
dependencies: []
parent_task_id: PF-4
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Current cook log photos render as tiny 96px thumbnails in a horizontal row with no context. Needs visual design work to match the cooking notebook feel.\n\nPossible directions:\n- Larger thumbnails in a 2-3 column grid instead of tiny inline row\n- Show alt text as visible captions below each photo\n- Timeline feel — photos ordered by time showing bake progression\n- Hero treatment for the "finished" shot, rest as supporting gallery\n- Responsive layout (full-width stacked on mobile, grid on desktop)\n\nCurrent state: v1 functional (thumbnails link to 800w in new tab, loading=lazy, decoding=async). Needs design pass for visual quality.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hero photo renders at full content width (not capped at max-w-lg)
- [ ] #2 Supporting photos display in a 2-3 column grid (not horizontal scroll row)
- [ ] #3 Supporting thumbnails larger than current h-28 — size TBD by visual review
- [ ] #4 Click opens photo in a simple lightbox overlay (replaces new-tab behavior)
- [ ] #5 Mobile: hero full-width, supporting stack to 2-col grid
- [ ] #6 Graceful display with 1, 3, or 5+ photos (no broken layouts)
- [ ] #7 Layout uses shortcuts from uno.config.ts
- [ ] #8 HITL gate — human sign-off before commit
- [ ] #9 npm run build passes
<!-- AC:END -->
