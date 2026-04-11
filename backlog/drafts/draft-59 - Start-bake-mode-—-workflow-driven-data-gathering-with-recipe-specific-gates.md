---
id: DRAFT-59
title: Start bake mode — workflow-driven data gathering with recipe-specific gates
status: Draft
assignee: []
created_date: '2026-04-11 17:58'
labels:
  - feature
  - workflow
  - data
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Raw idea from sweep session (2026-04-11):

User wants a "start bake" mode that is a workflow-driven helper to gather data during a bake. Each recipe would have specific gates — things that are important to log to improve, audit, and track over time.

Examples of gates (needs clarification per recipe):
- Indoor ambient temp at bake start
- Dough temp after mix
- Dough temp after bulk
- Internal bread temp at pull
- Preheat duration
- Rise percentage observations
- Timing between phases

The mode would prompt/remind the baker at the right moments during the active bake session. This is different from the post-bake /bake-log skill — this is real-time data capture as you bake.

Could overlap with PF-193 (weather/ambient temp capture at bake start) — that's one gate within this larger concept.

User note: "needs a clarification loop" — groom before implementing. The gate list per recipe needs to be defined collaboratively.
<!-- SECTION:DESCRIPTION:END -->
