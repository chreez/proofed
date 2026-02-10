---
id: PF-103
title: '`/triage` skill for backlog review and cleanup'
status: To Do
assignee: []
created_date: '2026-02-10 04:58'
labels:
  - ungroomed
  - dx
dependencies:
  - PF-102
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skill that provides a diagnostic dashboard of backlog health, then guides the user through triage decisions. Starts with summary view (stale tasks, in-progress validation, ungroomed count, what's active vs dormant). Sub-agent validates in-progress claims by checking git/file evidence — auto-demotes stale in-progress back to To Do. Then quick-fire triage flow per task (groom, defer, kill, merge, skip). Depends on PF-102 (Draft status) for clean status pipeline. User has additional ideas to add during grooming.
<!-- SECTION:DESCRIPTION:END -->
