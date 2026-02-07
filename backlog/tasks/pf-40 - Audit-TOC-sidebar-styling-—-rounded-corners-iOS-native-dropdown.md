---
id: PF-40
title: 'Audit TOC sidebar styling — rounded corners, iOS native dropdown'
status: To Do
assignee: []
created_date: '2026-02-07 01:32'
labels:
  - ux
  - ungroomed
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The TOC sidebar (desktop + mobile) needs a styling audit:\n\n- Some elements have rounded corners that violate the 0 border-radius design rule\n- Mobile bottom sheet drag handle uses rounded-full\n- FAB button may need explicit rounded-none\n- Consider using a native dropdown/select for iOS instead of the custom bottom sheet — better UX on mobile Safari\n- Desktop sidebar border is 1px/stone-300 instead of 2px/stone-200\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->
