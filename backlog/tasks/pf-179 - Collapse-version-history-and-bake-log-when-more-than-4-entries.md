---
id: PF-179
title: Collapse version history and bake log when more than 4 entries
status: Done
assignee: []
created_date: '2026-04-08 16:44'
updated_date: '2026-04-08 17:58'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The recipe page has two sections that grow unbounded: `VersionTimeline` (`change_log`) and `CookLogSection` (`cook_log`). Recipes with many iterations (e.g. `simple-sourdough` with 12 bakes and 7 change_log entries) create long scrolls before the reader reaches the next section.

## Behavior

When a section has more than 4 entries, only the newest 4 render by default. A "Show N more" button below the 4th entry expands the full list in-place. One-way expand — no "show less" toggle. Expanded state is transient (resets on navigation / reload).

## Context

- Both sections sort newest-first (cook log via `sortedCookLog()` composable, version timeline via JSON array order)
- `CookLogSection.vue` and `VersionTimeline.vue` live in `App.vue:555-570`
- TOC only links to section headers (`#cook-log-section`, `#version-history-section`) — does not deep-link to individual entries, so TOC auto-expand is a non-issue
- Threshold (4) and sort order are uniform across both sections for simplicity
- Snapshot tests exist for both components (per CLAUDE.md) and must be updated
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CookLogSection renders only the newest 4 entries when cook_log.length > 4; older entries are hidden
- [x] #2 VersionTimeline renders only the newest 4 entries when change_log.length > 4; older entries are hidden
- [x] #3 A 'Show N more' button renders below the 4th visible entry when entries are hidden; label shows exact count (e.g. 'Show 8 more bakes', 'Show 3 more versions')
- [x] #4 When the section has ≤4 entries, no button is shown and all entries render as today (no visual change)
- [x] #5 Clicking 'Show N more' reveals all hidden entries in-place; the button is removed after expanding (one-way)
- [x] #6 Expanded state is transient — navigating to a different recipe or reloading the page resets the section back to collapsed (newest 4 visible)
- [x] #7 Sort order matches today: CookLogSection uses sortedCookLog(); VersionTimeline uses array order
- [x] #8 TOC / anchor-link navigation to #cook-log-section and #version-history-section still works when collapsed (no broken scroll positions)
- [x] #9 Snapshot tests for CookLogSection and VersionTimeline are updated to cover both collapsed and expanded states
<!-- AC:END -->
