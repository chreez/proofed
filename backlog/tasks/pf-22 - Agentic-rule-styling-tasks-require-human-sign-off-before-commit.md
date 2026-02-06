---
id: PF-22
title: 'Agentic rule: styling tasks require human sign-off before commit'
status: To Do
assignee: []
created_date: '2026-02-06 19:04'
labels:
  - infra
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Any backlog task involving styling/UX/visual changes MUST have human-in-the-loop approval before committing. Agents should NOT autonomously push styling changes — they must present the change visually (screenshot, dev server URL, or description) and get explicit sign-off.

Context: PF-17 was "resolved" by an agent that just stripped all styling instead of fixing padding. This is unacceptable.

Implementation:
1. Add rule to CLAUDE.md under a new "Human-in-the-Loop Gates" section
2. Any task with labels: bug (styling), ux, or description mentioning CSS/padding/layout requires user confirmation before commit
3. Agent should open dev server and ask user to verify on device before marking done
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rule documented in CLAUDE.md
- [ ] #2 Styling tasks cannot be marked Done without user visual sign-off
- [ ] #3 Agent must present before/after to user before committing
<!-- AC:END -->
