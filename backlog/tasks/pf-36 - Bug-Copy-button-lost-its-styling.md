---
id: PF-36
title: 'Bug: Copy button lost its styling'
status: Done
assignee: []
created_date: '2026-02-07 00:48'
updated_date: '2026-02-07 01:44'
labels:
  - bug (styling)
  - ungroomed
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The per-section "Copy" button in gather sections appears unstyled — looks like a plain browser-default button with a basic border. Should match the design system (stone palette, 2px borders, no border-radius, proper padding/font).\n\nScreenshot: /Users/chris/Desktop/Screenshot 2026-02-06 at 6.48.23 PM.png\n\nLikely a regression from a recent change. Need to check StageCard.vue or GatherSection for the copy button classes.\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Copy button matches design system (stone palette, 2px border, 0 radius, proper padding)
- [x] #2 Button styling consistent with other interactive elements in the app
- [x] #3 Human visual sign-off on dev server before commit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Copy button in GatherSection.vue was unstyled (plain text link). Changed to `btn-secondary text-sm` to match design system — stone background, 2px border, 0 radius, proper padding.
<!-- SECTION:FINAL_SUMMARY:END -->
