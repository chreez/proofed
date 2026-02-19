---
id: PF-153
title: In-progress state for active bake sessions
status: To Do
assignee: []
created_date: '2026-02-19 02:34'
updated_date: '2026-02-19 03:19'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In-progress cook_log entry in recipe JSON that the agent writes to incrementally across sessions, rendered on the website as a linkable/QR-printable page during multi-day bakes. Agent writes, site reads (for now). Solves the problem of scratchpad notes being lost to localStorage clears during deploys, and bake context being lost between agent sessions.

## User Pain Points
- Scratchpad localStorage gets cleared on deploys
- Bakes span multiple days — no persistent linkable entry until bake is fully done
- Agent context lost between sessions — no durable place to build up bake notes
- Want to print QR codes during downtime to quickly access the in-progress entry on phone
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CookLogEntry type in recipe.ts supports an optional status field ("in_progress" | "complete") — omitted defaults to "complete" (backward compatible)
- [ ] #2 Agent can create a cook_log entry with status: "in_progress" in recipe JSON at bake start, before the bake is finished
- [ ] #3 In-progress entries are incrementally updated across agent sessions — notes, photos, and metadata accumulate over time
- [ ] #4 BakeDetailView renders in-progress entries without errors — gracefully handles missing photos, partial notes, no summary
- [ ] #5 In-progress bake detail page shows a visible "In Progress" indicator (badge/banner)
- [ ] #6 In-progress entries appear in the bake log list (BakeLogPage / CookLogSection) with an in-progress visual distinction
- [ ] #7 QR code / share URL works for in-progress entries — linkable before bake is complete
- [ ] #8 When bake is finalized, agent sets status: "complete" (or removes the field) — no visual indicator on completed entries
- [ ] #9 /bake-log skill updated to support creating in-progress entries and finalizing them
- [ ] #10 Existing cook_log entries without a status field continue to render as before (no migration needed)
<!-- AC:END -->
