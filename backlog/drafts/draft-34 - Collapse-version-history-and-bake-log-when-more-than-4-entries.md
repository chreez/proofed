---
id: DRAFT-34
title: Collapse version history and bake log when more than 4 entries
status: Draft
assignee: []
created_date: '2026-04-08 16:44'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The recipe page has two sections that grow unbounded: `VersionTimeline` (change_log) and `CookLogSection` (cook_log). Recipes with many iterations (e.g. sourdough with 12 bakes, 7 change_log entries) create long scrolls before a reader reaches the next section.

Proposal: both sections collapse to show the first 4 entries when there are more than 4, with a "show all" / "show N more" toggle to expand.

## Questions to groom

- Does "first 4" mean newest 4 (most recent at top) or oldest 4? Current sort order should be verified for each section.
- Default state: always collapsed when >4, or remember user preference?
- Expand/collapse UX: button below the last visible entry, or a count badge on the section header?
- Does this apply uniformly to both sections, or should each have its own threshold?
- Any accessibility concerns with collapse behavior (scroll position, focus management)?
- Related: does TOC linking to a specific entry auto-expand the collapse?

This is a draft — needs clarify loop before it becomes a PF- task.
<!-- SECTION:DESCRIPTION:END -->
