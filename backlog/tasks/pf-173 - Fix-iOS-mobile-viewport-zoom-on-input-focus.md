---
id: PF-173
title: Fix iOS mobile viewport zoom on input focus
status: Done
assignee: []
created_date: '2026-04-03 01:17'
updated_date: '2026-04-09 18:58'
labels:
  - bug (styling)
  - ux
dependencies: []
references:
  - src/components/ScratchpadNote.vue
  - src/components/GeneralNotesFab.vue
  - 'PF-164 (related, Done)'
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When tapping a note input on iPhone, the page zooms in and doesn't restore the viewport. User must manually pinch to zoom back out. Root cause: iOS Safari auto-zooms on input focus when font-size < 16px. ScratchpadNote uses text-xs (12px) on inputs/textareas, GeneralNotesFab same. Separate from PF-164 (notes popover overflow, Done).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All <input> and <textarea> elements in ScratchpadNote, GeneralNotesFab, and any other mobile-facing components use font-size >= 16px (or equivalent CSS to prevent iOS Safari auto-zoom)
- [x] #2 Viewport returns to normal zoom level after input blur — no manual pinch-to-zoom required
- [x] #3 Verified on iPhone Safari (375px width)
- [x] #4 Desktop styling not regressed
- [x] #5 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Subagent complete. 7 files changed: ScratchpadNote.vue, GeneralNotesFab.vue, ReminderBanner.vue, BakeReviewPage.vue, PhotoReview.vue, DemoScratchpad.vue, DemoCostPicker.vue. Approach: `text-base md:text-xs` (16px mobile, 12px desktop) via UnoCSS responsive utilities. Build passes. HITL gate: visual review on iPhone + desktop.
<!-- SECTION:NOTES:END -->
