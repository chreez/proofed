---
id: PF-44
title: Add diff-coverage gate for new/changed code
status: To Do
assignee: []
created_date: '2026-02-07 02:32'
labels:
  - infra
  - ungroomed
dependencies:
  - PF-8
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wire up diff-test-coverage (or similar) to enforce higher coverage thresholds (e.g., 90%) on new/changed lines only. Requires lcov reporter added to vitest config. Research done in PF-8 session — best Node.js option is diff-test-coverage npm package. Could also evaluate Codecov patch coverage if/when CI is added.
<!-- SECTION:DESCRIPTION:END -->
