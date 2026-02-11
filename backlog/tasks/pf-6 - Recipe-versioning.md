---
id: PF-6
title: Recipe versioning
status: To Do
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-10 08:20'
labels:
  - recipe
dependencies: []
priority: low
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two parts:\n\n1. Formalize semver convention: major = different method, minor = ingredient adjustment, patch = note/clarification. Document in CLAUDE.md and add validation check.\n\n2. Spike: explore tooling to simplify version bumps — could be a CLI script, agent workflow, or backlog.md integration that auto-bumps version + creates change_log entry when recipe JSON changes.\n\nVersioning is already in use (v1.0.0, v1.1.0 exist). This formalizes and potentially automates it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Semver convention documented in CLAUDE.md
- [ ] #2 Validation check: version field matches semver format
- [ ] #3 Validation check: every version has a change_log entry
- [ ] #4 Spike: evaluate auto-increment tooling options
<!-- AC:END -->
