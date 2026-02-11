---
id: PF-19
title: Variant pill placement - Consider moving
status: Done
assignee: []
created_date: '2026-02-06 18:53'
updated_date: '2026-02-07 01:44'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The variant tabs (Quick / Overnight / Ultimate) have issues with both placement and visual style. Currently they sit between the recipe meta card and the first stage card as bordered pills.\n\nAgent must mockup 2-3 alternative placements (in header bar, under title, floating/sticky) AND 2-3 visual styles (underline tabs, pills, segmented control). Present to user for comparison before implementing.\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 2-3 placement mockups presented to user for comparison
- [x] #2 2-3 visual style options presented (underline tabs, pills, segmented control, etc.)
- [x] #3 User selects placement + style before implementation
- [x] #4 Chosen design works on both desktop and mobile
- [x] #5 Human visual sign-off on dev server before commit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Presented 3 mockup styles (A: underline tabs, B: segmented control, C: header pills) with a dev toolbar switcher. User selected Style A — clean underline tabs with accent-colored bottom border on active tab. Removed all mockup code (Styles B/C, compact prop, dev toolbar). VariantTabs.vue now has single clean interface: familyId prop, select emit.
<!-- SECTION:FINAL_SUMMARY:END -->
