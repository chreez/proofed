---
id: PF-27
title: Add HTML snapshot tests for key components
status: To Do
assignee: []
created_date: '2026-02-06 20:16'
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
- [ ] #1 Snapshot tests exist for StageCard, RecipeMeta, CookLogSection, VersionTimeline, GatherSection, TocSidebar
- [ ] #2 Snapshots committed to repo
- [ ] #3 Modifying component structure causes snapshot failure in npm run build
- [ ] #4 Agent-verifiable: snapshot mismatch blocks commit via pre-commit hook
<!-- AC:END -->
