---
id: PF-4.5
title: Render cook log photos on recipe page
status: To Do
assignee: []
created_date: '2026-02-07 04:36'
labels:
  - implement
dependencies:
  - PF-4.3
  - PF-4.4
parent_task_id: PF-4
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Vue component/template to display photos referenced in cook_log entries. Images use loading="lazy", decoding="async", proper alt text. Follows rendering approach from PF-4.2 design.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Photos render in cook log section when referenced in recipe JSON
- [ ] #2 Images use loading="lazy" and decoding="async"
- [ ] #3 Alt text displayed from PhotoReference.alt field
- [ ] #4 Caption displayed when present
- [ ] #5 Graceful handling when cook_log has no photos
- [ ] #6 Responsive display (full-width on mobile, constrained on desktop)
- [ ] #7 npm run build passes
<!-- AC:END -->
