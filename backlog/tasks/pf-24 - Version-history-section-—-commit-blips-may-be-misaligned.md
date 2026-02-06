---
id: PF-24
title: Version history section — commit blips may be misaligned
status: To Do
assignee: []
created_date: '2026-02-06 19:53'
updated_date: '2026-02-06 20:20'
labels:
  - bug
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Timeline dots in Version History are vertically misaligned with the version text baseline. Visible on both desktop and mobile.\n\nConsider using a timeline library or referencing GitHub's commit timeline pattern for proper alignment. Current implementation is hand-rolled CSS.\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Timeline dots align vertically with version text baseline
- [ ] #2 Consistent alignment across entries (v1.0.0, v1.1.0, etc.)
- [ ] #3 Works on both desktop and mobile
- [ ] #4 Research: evaluate timeline library vs CSS fix
- [ ] #5 Human visual sign-off on dev server before commit
<!-- AC:END -->
