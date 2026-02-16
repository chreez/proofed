---
id: PF-143
title: X close icon consistency + prompted notes resolve UX
status: To Do
assignee: []
created_date: '2026-02-16 22:26'
labels:
  - bug
  - ux
dependencies: []
references:
  - 'src/components/ScratchpadNote.vue:101 — popover close'
  - 'src/components/GeneralNotesFab.vue:82,98,153 — FAB + panel close'
  - 'src/components/ShareModal.vue:208 — modal close'
  - 'src/components/PhotoLightbox.vue:426 — lightbox close'
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two sub-issues:

1. X close icons look like bordered buttons instead of blending in like other icon actions on the site. Want consistent, borderless icon styling across all close buttons (scratchpad popover, general notes panel, share modal, photo lightbox).

2. Prompted notes (reminders) stay visible after user enters a value. Need demo spike to explore options for post-input behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All X close buttons use consistent borderless icon styling (no visible border/background in default state)
- [ ] #2 Hover state matches other icon actions on the site (subtle color shift, no background box)
- [ ] #3 Consistent size across similar contexts (modals, popovers, panels)
- [ ] #4 Lightbox close stays white-on-dark (appropriate for overlay context)
- [ ] #5 Prompted notes post-input behavior decided via demo spike (DRAFT-15.1)
<!-- AC:END -->
