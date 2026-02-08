---
id: PF-77
title: Flip D2 temp format to °F (°C) across all recipes
status: To Do
assignee: []
created_date: '2026-02-08 11:07'
labels:
  - recipe
  - infra
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Change temperature convention from Celsius-primary to Fahrenheit-primary. D2 currently says "Temps formatted as 175°C (350°F)" — should be "350°F (175°C)". Update D2 rule, all recipe JSONs, validation tests, CLAUDE.md, and TempText component if it parses/renders temp format.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 D2 checklist rule updated: temps formatted as `350°F (175°C)` (Fahrenheit primary)
- [ ] #2 All existing recipe JSONs updated to °F (°C) format
- [ ] #3 TempText component updated if it parses temp format order
- [ ] #4 Validation test for D2 updated to match new format
- [ ] #5 CLAUDE.md recipe contract updated
- [ ] #6 `npm run build` passes
<!-- AC:END -->
