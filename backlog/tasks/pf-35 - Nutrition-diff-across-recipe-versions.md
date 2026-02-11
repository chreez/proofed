---
id: PF-35
title: Nutrition diff across recipe versions
status: To Do
assignee: []
created_date: '2026-02-07 00:42'
updated_date: '2026-02-10 08:20'
labels:
  - feature
  - ungroomed
dependencies: []
priority: low
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When viewing version history, show how nutritional values changed between versions. E.g. "v1.1 → v1.2: -84g sugar, +28g cream cheese, -120 kcal per serving."\n\nThis requires nutrition data to exist on multiple versions (depends on PF-14 nutrition being complete). Could be a simple before/after table in the version timeline, or a dedicated comparison view.\n\nNeeds spike to determine: Do we store nutrition snapshots per version in the JSON? Or compute diffs at render time from ingredient weight changes?
<!-- SECTION:DESCRIPTION:END -->
