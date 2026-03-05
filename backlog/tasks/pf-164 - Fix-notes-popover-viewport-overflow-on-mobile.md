---
id: PF-164
title: Fix notes popover viewport overflow on mobile
status: To Do
assignee: []
created_date: '2026-03-05 05:03'
updated_date: '2026-03-05 05:21'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Spike PF-164.1 Output: Mobile Notes UX Research\n\n### Current Problem\nScratchpadNote popover uses `absolute top-full` positioning. The popover itself fits width-wise (w-72 with max-w calc), but **height overflows** — the inner `max-h-80` (320px) doesn't account for where the trigger sits in the viewport. With 2+ reminders, content exceeds available space below the trigger on iPhone.\n\n### Existing Codebase Patterns\n- **TocSidebar**: Mobile bottom sheet with drag handle, backdrop, touch-to-dismiss, slide-up transition. Proven pattern.\n- **GeneralNotesFab**: Fixed panel (bottom-left), Teleport to body, scrollable. Same feature set as ScratchpadNote but global.\n- **PhotoLightbox**: Full-screen modal (too heavy for notes).\n- **ShareModal**: Centered modal.\n- **TechniqueText**: Same absolute overflow problem — also a candidate for fix.\n\n### Alternatives Evaluated\n\n| Pattern | Fit | Complexity | Verdict |\n|---------|-----|------------|--------|\n| Bottom sheet | Excellent | Low | **Recommended** |\n| Full-screen panel | Adequate but excessive | Low | Too heavy for micro-interaction |\n| Inline expand | Workable but awkward | Medium | Layout shift jarring during bake |\n| Viewport-aware flip | Poor | High | Doesn't solve fundamental height problem, keyboard nightmare |\n\n### Recommendation: Bottom Sheet on Mobile\n\n**Rationale:**\n1. Pattern already exists in TocSidebar — reuse infrastructure\n2. Solves overflow completely (anchored to viewport bottom)\n3. Best mobile input UX (thumb zone, keyboard-friendly)\n4. No desktop regression (responsive split with md: breakpoint)\n5. Brand-consistent (same design tokens)\n\n**Implementation Notes:**\n- Extract reusable `BottomSheet` component from TocSidebar (backdrop, drag-to-dismiss, transitions)\n- Both ScratchpadNote and TocSidebar consume shared BottomSheet\n- Step ID in sheet header for context\n- Auto-focus textarea on open\n- Use `dvh` units for max-height (keyboard-aware)\n- Reuse existing `slide-up` and `fade` transitions\n- TechniqueText tooltips: consider same pattern or viewport-aware flip (simpler read-only content)"
<!-- SECTION:NOTES:END -->
