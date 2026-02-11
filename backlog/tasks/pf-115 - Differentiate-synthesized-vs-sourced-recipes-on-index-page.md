---
id: PF-115
title: Differentiate synthesized vs sourced recipes on index page
status: To Do
assignee: []
created_date: '2026-02-11 05:01'
labels:
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a robot icon next to synthesized recipe names on the index page with a tooltip showing provenance details. Adapted recipes may also get their own icon — demo spike will determine.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Synthesized recipes (those with research block and source.type === 'original') show a robot icon on the same row as the recipe name
- [ ] #2 Hovering the robot icon shows a tooltip with the source name and number of sources (e.g. "Multi-Agent Research Synthesis — 92 sources")
- [ ] #3 Tooltip styling matches existing toolbar icon tooltips in the app
- [ ] #4 Robot icon is read-only (no click action)
- [ ] #5 Icon uses a subdued color from the stone palette, consistent with the index page's visual weight
<!-- AC:END -->
