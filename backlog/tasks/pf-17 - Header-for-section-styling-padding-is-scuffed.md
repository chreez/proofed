---
id: PF-17
title: Header for section styling - padding is scuffed
status: To Do
assignee: []
created_date: '2026-02-06 18:52'
updated_date: '2026-02-06 19:09'
labels:
  - bug
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Section headers (stage titles) currently have a visible box/border around them that looks garish. Instead of fixing padding, remove the box treatment entirely and let headers blend into the section's own styling. The header should feel like a natural part of the card, not a separate bordered element.\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Section headers have no separate box/border treatment
- [ ] #2 Headers blend naturally into their parent card styling
- [ ] #3 Human visual sign-off on dev server before commit
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**2026-02-06 — Reverted.** First attempt stripped all styling instead of fixing the actual issue.\n\n**2026-02-06 — Clarified intent.** The real fix is removing the box/border around section titles, not adjusting padding. Headers should blend with the section card styling.

Changes were reverted by user/linter. Needs re-implementation with user sign-off.
<!-- SECTION:NOTES:END -->
