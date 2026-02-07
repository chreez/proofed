---
id: PF-4.8
title: Cook log photo gallery styling and layout
status: To Do
assignee: []
created_date: '2026-02-07 05:32'
updated_date: '2026-02-07 09:06'
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
- [ ] #1 Photos display larger than current 96px thumbnails (size determined by spike)
- [ ] #2 Alt text renders as visible caption below/beside each photo
- [ ] #3 Layout uses shortcuts from uno.config.ts — no one-off utility combinations
- [ ] #4 Gallery feels integrated with cook log entry (inside border-l accent block, after notes)
- [ ] #5 Graceful display with 1 photo, 3 photos, or 5+ photos (no broken layouts)
- [ ] #6 Click behavior determined by spike (current new-tab preserved until spike decides)
- [ ] #7 Mobile layout determined by spike
- [ ] #8 npm run build passes
<!-- AC:END -->
