---
id: PF-150
title: Audit test suite for bloat - are tests earning their keep?
status: To Do
assignee: []
created_date: '2026-02-17 23:19'
labels:
  - dx
  - infra
  - spike
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
One-time investigation of the test suite. Are we paying build time for tests that don't catch real bugs? Output is a report with actionable recommendations on what to keep, cut, rewrite, or merge.

Look at: test count vs actual regression catches, snapshot test value, slow test files, coverage overlap between integration and unit tests.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Report documents total test count, execution time per file, and coverage percentage
- [ ] #2 Each test file assessed for regression value — has it caught a real bug? Would removal risk regressions?
- [ ] #3 Snapshot tests specifically evaluated: maintenance cost vs structural protection value
- [ ] #4 Slow tests identified (>500ms) with justification to keep or optimize
- [ ] #5 Coverage overlap between test files documented — redundant coverage flagged
- [ ] #6 Recommendations written per test file: keep, cut, rewrite, or merge — with rationale
- [ ] #7 Findings documented in task notes for future reference
<!-- AC:END -->
