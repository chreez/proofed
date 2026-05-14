---
id: DRAFT-107
title: >-
  Passive-batching solver engine — implement Suggestion[] generator from queue +
  library
status: Draft
assignee: []
created_date: '2026-05-14 20:32'
labels:
  - engineer
  - scheduler
  - bakery-ops
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-270 design §4. Implement the batch-buddy solver as a pure function. Input: { queue: Bake[], library: Recipe[], constraints, muteList }. Output: ranked Suggestion[]. Cheap-filter pass (prep_active_min vs window size) then tryPlace micro-scheduler that walks candidate state-by-state checking oven/baker/fridge constraints. Unit-tested against ATK Cinnamon Buns + SD Cookies fixture (the motivating example in design §1). Pure TS, no UI.
<!-- SECTION:DESCRIPTION:END -->
