---
id: PF-164
title: Fix notes popover viewport overflow on mobile
status: To Do
assignee: []
created_date: '2026-03-05 05:03'
labels:
  - bug (styling)
  - ux
dependencies: []
references:
  - src/components/ScratchpadNote.vue
  - src/components/ReminderBanner.vue
  - src/components/TechniqueText.vue
  - src/components/IconButton.vue
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ScratchpadNote popover (sticky note icon on each recipe step) frequently overflows the viewport on mobile (iPhone). When reminders are present inside the popover, content runs off-page and becomes unreadable/unusable. The broader notes UI may need rethinking for mobile — spike first to determine the right pattern.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ScratchpadNote popover content is fully readable within viewport bounds on iPhone (375px width, no horizontal or vertical clipping)
- [ ] #2 Popover with reminders (3+ reminder prompts) remains usable — all inputs reachable, all text visible
- [ ] #3 Popover content is scrollable when it exceeds available viewport space
- [ ] #4 Existing desktop popover behavior is not regressed
- [ ] #5 Technique glossary tooltips and IconButton tooltips reviewed for same viewport clipping issues and fixed if affected
<!-- AC:END -->
