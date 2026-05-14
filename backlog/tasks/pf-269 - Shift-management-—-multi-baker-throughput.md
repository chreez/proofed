---
id: PF-269
title: Shift management — multi-baker throughput
status: To Do
assignee: []
created_date: '2026-05-12'
updated_date: '2026-05-14 20:31'
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Design doc exists at backlog/tasks/pf-269-design-notes.md and is referenced from this task.
- [ ] #2 Doc specifies Baker profile type: { id, name, hourlyRate, skills?, availableWindows? } with field semantics and required vs optional.
- [ ] #3 Doc specifies BakerAssignment shape (which baker handles which state of which bake) and its storage/lookup pattern.
- [ ] #4 Doc covers drag-to-assign UX on scheduler — drop bake onto baker timeline, auto-suggest distribution across active states.
- [ ] #5 Doc encodes constraint rules: oven still 1 exclusive resource, active-prep splits across N bakers, passive ignores baker count.
- [ ] #6 Doc specifies sort + filter modes on recipe library: $/hr per baker, fastest to bake, highest CP.
- [ ] #7 Doc specifies reporting view: per-baker active hours + per-baker revenue + per-baker $/hr realized over a window.
- [ ] #8 Doc enumerates edge cases (baker leaves mid-bake, sick day, overlapping windows, parallel-prep states) with proposed handling + open questions called out.
- [ ] #9 Doc references DRAFT-94 (observed step times + per-state worker assignment) as the granular follow-on and notes the relationship.
- [ ] #10 User has signed off on the design doc.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Design doc: `backlog/tasks/pf-269-design-notes.md`

Promoted from DRAFT-92 on 2026-05-12. Companion to PF-255.4 single-baker scheduler design and PF-256 S8 slice. Extends with finer granularity in DRAFT-94 (observed step times + per-state worker capacity).
<!-- SECTION:NOTES:END -->
