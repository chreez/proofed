---
id: DRAFT-92
title: Shift management — multi-baker throughput
status: Draft
assignee: []
created_date: '2026-05-12'
labels:
  - bakery-ops
  - scheduler
  - throughput
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255 rework clarify loop (2026-05-12). User intent extends past single-baker assumption.

Multi-baker support on the scheduler. Each baker is a resource with capacity (active hours, skill tags). Recipes get sorted/assigned to maximize:
- Throughput (most units/day)
- $/hour per baker (best margin work first)
- Speed (fastest baker handles tightest deadlines)

Touches PF-255.4 scheduler design — currently assumes single home baker. Adds baker-as-resource alongside oven-as-resource. Constraint solver gets harder: oven still 1, but active prep splits across N bakers, passive proofs ignore baker count.

Scope flags:
- Baker profiles (hourly rate, skills, available windows)
- Assignment UI (drag a bake → who handles which phase)
- Active-only conflict checks (passive doesn't compete for a baker)
- Sort modes on the recipe library: "Most $/hr for me", "Fastest to bake", "Highest CP"
- Reporting: per-baker revenue, per-baker hours
<!-- SECTION:DESCRIPTION:END -->
