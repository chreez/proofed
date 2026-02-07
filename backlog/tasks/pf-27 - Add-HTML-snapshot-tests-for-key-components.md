---
id: PF-27
title: Add HTML snapshot tests for key components
status: Done
assignee: []
created_date: '2026-02-06 20:16'
updated_date: '2026-02-07 02:16'
labels:
  - infra
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add Vitest snapshot tests that capture rendered HTML structure of critical components. Catches structural regressions: removed wrapper divs, missing classes, stray elements, broken layouts.\n\nTarget components: StageCard, RecipeMeta, CookLogSection, VersionTimeline, GatherSection, TocSidebar.\n\nUse `expect(wrapper.html()).toMatchSnapshot()` pattern. Snapshots commit to repo so agents see failures when they break structure.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Snapshot tests exist for StageCard, RecipeMeta, CookLogSection, VersionTimeline, GatherSection, TocSidebar
- [x] #2 Snapshots committed to repo
- [x] #3 Modifying component structure causes snapshot failure in npm run build
- [x] #4 Agent-verifiable: snapshot mismatch blocks commit via pre-commit hook
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added HTML snapshot tests for 6 key components: StageCard, RecipeMeta, CookLogSection, VersionTimeline, GatherSection, TocSidebar.\n\nNew npm scripts: `build:fast` (skip tests), `build:test` (tests only). Full `build` remains the commit gate.\n\nAdded Agent Snapshot Protocol to CLAUDE.md: ≤2 snapshot failures = auto-update and note; ≥3 = stop and escalate to user (blast radius check). Forensic use via `git log -p __snapshots__/`.\n\nTests: 106 → 112. Created new spec files for RecipeMeta and GatherSection.
<!-- SECTION:FINAL_SUMMARY:END -->
