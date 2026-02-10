---
id: PF-102
title: 'Rework status pipeline: add Draft status, backfill ungroomed tasks'
status: To Do
assignee: []
created_date: '2026-02-10 04:58'
labels:
  - dx
  - infra
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Clean up the status pipeline by adding Draft as a real status instead of using the `ungroomed` label as a pseudo-status. Draft = idea captured, not groomed, not ready. To Do = groomed, ACs written, ready to pick up.\n\nChanges:\n1. Add `Draft` to `config.yml` statuses array (before To Do)\n2. Backfill all tasks with `ungroomed` label → status Draft, remove the label\n3. Update `grooming.md`: grooming completion = Draft → To Do (not \"remove ungroomed label\")\n4. Update `CLAUDE.md`: references to `ungroomed` label → Draft status\n5. Update skills (`/validate`, `/research`) if they reference the old vernacular
<!-- SECTION:DESCRIPTION:END -->
