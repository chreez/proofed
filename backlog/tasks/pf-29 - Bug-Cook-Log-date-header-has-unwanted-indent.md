---
id: PF-29
title: 'Bug: Cook Log date header has unwanted indent'
status: To Do
assignee: []
created_date: '2026-02-07 00:22'
updated_date: '2026-02-07 01:23'
labels:
  - bug (styling)
  - ungroomed
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The cook log date subsection headers (e.g. 'Wednesday, February 4, 2026') have a small left indent that looks off. The header should align flush with the section — no indent. Bullet points below are fine as-is.\n\nAlso visible: the left border/timeline line and 'NEXT TIME' label may have slight alignment issues (circled in screenshot).\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Cook log date headers (e.g. 'Wednesday, February 4, 2026') align flush left with section header
- [ ] #2 Bullet points below date headers remain indented (unchanged)
- [ ] #3 Timeline left border alignment consistent top to bottom
- [ ] #4 Human visual sign-off on dev server before commit
<!-- AC:END -->
