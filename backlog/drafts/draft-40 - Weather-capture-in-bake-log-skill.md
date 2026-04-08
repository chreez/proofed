---
id: DRAFT-40
title: Weather capture in /bake-log skill
status: Draft
assignee: []
created_date: '2026-04-08 17:04'
labels:
  - ungroomed
dependencies:
  - PF-177
parent_task_id: PF-177
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add weather estimate capture to the `/bake-log` skill. Weather is more pertinent for bulk ferment day and room-temp proof day(s) than the day the bake ends, so multi-day bakes need per-day capture. Estimation is acceptable — user provides ballpark from memory/weather app, no API required.

Needs grooming — prompt flow, where data lives in cook_log entry, how it feeds the stats block schema.
<!-- SECTION:DESCRIPTION:END -->
