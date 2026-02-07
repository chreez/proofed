---
id: PF-54
title: Section permalinking with link icon
status: Done
assignee: []
created_date: '2026-02-07 05:34'
updated_date: '2026-02-07 20:14'
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
- [x] #1 Every section heading (stages, Cook Log, Version History, Nutrition) has a link icon action
- [x] #2 Tapping the link icon copies the section's permalink URL to clipboard (e.g. `https://host/recipe/id#stage-prep`)
- [x] #3 URL bar hash is NOT updated on tap — clipboard only
- [x] #4 Uses existing IconButton component with flashCopied feedback pattern
- [x] #5 Agent demos 2 placement mockups (always-visible vs hover-reveal) for user selection
- [x] #6 This is a styling task — human visual sign-off before commit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added always-visible link icons (Link2, stone-300) to all section headings: StageCard, CookLogSection, VersionTimeline, NutritionSection. Tap copies permalink URL to clipboard with flashCopied feedback. Hash scroll on page load. Reduced global flashCopied duration from 2000ms to 1200ms.
<!-- SECTION:FINAL_SUMMARY:END -->
