---
id: PF-52
title: Replace Copy and Reset buttons with icon-only actions
status: Done
assignee: []
created_date: '2026-02-07 04:29'
updated_date: '2026-02-07 05:26'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The RecipeMeta header currently has text buttons ("Copy Recipe", "Reset Bake") that clutter the UI. Replace with icon-only buttons:\n\n- Clipboard icon for Copy Recipe\n- Reset/refresh icon for Reset Bake\n\nIcons should be minimal, monochrome (ink color), and match the design system. Tooltip on hover for discoverability. Same functionality, smaller footprint.\n\nAlso audit the per-section "Copy" buttons in GatherSection — same icon treatment.\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Agent demos 2-3 icon source/style approaches (inline SVG, icon library, etc.) as mockups for user comparison before implementation
- [ ] #2 Agent demos 2-3 "Copied!" feedback patterns (icon swap, color flash, etc.) for user selection
- [ ] #3 All existing Copy buttons (RecipeMeta "Copy Recipe", GatherSection per-section "Copy") replaced with icon-only clipboard buttons
- [ ] #4 Reset icon added to each resettable section (gather sections, stage cards) — not on read-only sections (Cook Log, Version History)
- [ ] #5 Global "Reset Bake" in RecipeMeta header also converted to icon
- [ ] #6 Icons have tooltip on hover for discoverability
- [ ] #7 Minimum 44x44px tap target on mobile
- [ ] #8 This is a styling task — human visual sign-off before commit
<!-- AC:END -->
