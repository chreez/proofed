---
id: PF-43
title: Increase test coverage to 90% across all metrics
status: To Do
assignee: []
created_date: '2026-02-07 02:23'
labels:
  - testing
  - ungroomed
dependencies:
  - PF-8
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Current coverage baseline (2026-02-06): 75% stmts, 59% branches, 80% functions, 76% lines. Gap is mostly in GatherSection (32%), RecipeMeta (24%), TocSidebar (44%). Write tests to bring all four metrics to 90%+. Dead code removal (PF-10) may help by shrinking the denominator.
<!-- SECTION:DESCRIPTION:END -->
