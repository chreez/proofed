---
id: PF-181
title: Remove per-recipe bars from stats page
status: Done
assignee: []
created_date: '2026-04-08 19:00'
updated_date: '2026-04-08 19:00'
labels:
  - bug (styling)
  - ux
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The `/stats` page per-recipe section currently renders a horizontal micro-bar alongside each recipe's inline count (added in c6140f7). After visual review the bars add clutter without adding information — the inline counts are sufficient for scanning the distribution.

## Behavior

Remove the horizontal micro-bars from the per-recipe list on `/stats`. Keep the inline count text (e.g. "12 bakes") on each row. Everything else on the stats page stays as-is.

## Context

- Bars were added in commit `c6140f7` ("feat: replace per-recipe bars with micro-bar + inline counts, add total to Production Mix")
- Only the bars go — the inline counts stay
- Other tiles / sections on the stats page are untouched
- Visual HITL required before commit (labels: bug (styling), ux)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Horizontal micro-bars are removed from the per-recipe section of the /stats page
- [x] #2 Inline recipe counts (e.g. "12 bakes") continue to render unchanged
- [x] #3 No other visual changes elsewhere on the stats page (tiles, headers, other sections remain identical)
- [x] #4 Unused CSS classes associated with the bars are cleaned up
- [x] #5 Snapshot tests for StatsPage (if any) are updated to reflect the new DOM
- [x] #6 npm run build passes
- [x] #7 Visual HITL approval before commit
<!-- AC:END -->
