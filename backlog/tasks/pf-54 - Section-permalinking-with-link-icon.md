---
id: PF-54
title: Section permalinking with link icon
status: To Do
assignee: []
created_date: '2026-02-07 05:34'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Any section heading (stages, Cook Log, Version History, Nutrition) gets a link icon. Tapping copies the section's permalink URL to clipboard (e.g. `https://host/recipe/id#stage-prep`). No URL bar hash update — clipboard only. Reuses existing IconButton component with flashCopied feedback. This is a styling task — requires human visual sign-off before commit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every section heading (stages, Cook Log, Version History, Nutrition) has a link icon action
- [ ] #2 Tapping the link icon copies the section's permalink URL to clipboard (e.g. `https://host/recipe/id#stage-prep`)
- [ ] #3 URL bar hash is NOT updated on tap — clipboard only
- [ ] #4 Uses existing IconButton component with flashCopied feedback pattern
- [ ] #5 Agent demos 2 placement mockups (always-visible vs hover-reveal) for user selection
- [ ] #6 This is a styling task — human visual sign-off before commit
<!-- AC:END -->
