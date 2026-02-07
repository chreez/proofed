---
id: PF-60
title: Type the rolling_tips_research field in cook_log
status: To Do
assignee: []
created_date: '2026-02-07 09:01'
labels:
  - bug
  - ungroomed
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The atk-cinnamon-buns-ultimate.json cook_log entry contains a `rolling_tips_research` array that is not defined in the CookLogEntry TypeScript interface. Data is silently ignored — no component renders it, no test validates it.\n\nDecide: should research notes live in cook_log? If yes, add to interface. If not, move to a more appropriate location (recipe state notes, separate research section).\n\nPer Voice checks V1-V4: research notes are not personal cook experience and shouldn't be presented as such.
<!-- SECTION:DESCRIPTION:END -->
