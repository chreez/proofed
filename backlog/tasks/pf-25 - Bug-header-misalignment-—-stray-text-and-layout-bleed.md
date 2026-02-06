---
id: PF-25
title: 'Bug: header misalignment — stray text and layout bleed'
status: To Do
assignee: []
created_date: '2026-02-06 20:10'
updated_date: '2026-02-06 20:19'
labels:
  - bug
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Desktop only: the 'proofed.' header is centered on the full viewport width, but the recipe card content is offset left due to the TOC sidebar taking space on the right. This makes the header and body appear misaligned — they don't share the same left edge.\n\nAlso: stray 'ar' text visible at top-left corner (likely a leftover element).\n\nMobile looks fine — sidebar collapses to FAB so no offset.\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Header 'proofed.' aligns with recipe card content area on desktop
- [ ] #2 No stray text visible at top-left corner
- [ ] #3 Mobile layout unaffected
- [ ] #4 TOC sidebar does not cause content misalignment
- [ ] #5 Human visual sign-off on dev server before commit
<!-- AC:END -->
