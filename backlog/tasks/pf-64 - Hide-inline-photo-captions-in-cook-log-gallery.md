---
id: PF-64
title: Hide inline photo captions in cook log gallery
status: To Do
assignee: []
created_date: '2026-02-07 11:37'
labels:
  - bug (styling)
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AI-generated alt text is displayed as visible figcaption under each cook_log photo. It reads as inhuman/tacky inline. Alt text should remain for accessibility and be available on hover (title attr) but not shown as visible text.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Remove visible <figcaption> elements from hero and supporting photos in CookLogSection.vue
- [ ] #2 Keep alt attribute on all <img> tags for accessibility
- [ ] #3 Add title attribute on photos so caption shows on desktop hover
- [ ] #4 No other gallery layout changes
- [ ] #5 npm run build passes
<!-- AC:END -->
