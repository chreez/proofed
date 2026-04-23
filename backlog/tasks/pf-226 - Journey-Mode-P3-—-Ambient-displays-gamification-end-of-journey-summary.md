---
id: PF-226
title: Journey Mode P3 — Ambient displays + gamification + end-of-journey summary
status: To Do
assignee: []
created_date: '2026-04-23 21:46'
updated_date: '2026-04-23 22:29'
labels:
  - feature
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Phase 3: Ambient Displays + Gamification

Visual layer and reward system on top of the journey skeleton + smart inputs.

### Scope

1. **Ambient dashboard** — avg dough temp, current aliquot, elapsed segment time, kitchen temp. Recalculated on every load/unlock.
2. **Hidden points system** — actions earn points silently. Minimal celebration animations on completion ("good job! +10"). Score hidden until journey complete.
3. **End-of-journey summary screen:**
   - Split times per stage/segment
   - Timestamp override UI (correct form inputs for fixing logged times)
   - Notes/feedback field for bake-log agent
   - Total active time (excluding passive waits)
   - All data flows into bake-log review pipeline
4. **Points categories TBD** — data capture completeness, speed vs targets, etc.

### Depends on: P2 smart inputs
### Parent: DRAFT-66
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ambient dashboard displays running averages (dough temp, aliquot, kitchen temp) and elapsed segment time — all recalculated on component mount, no polling
- [ ] #2 Points accumulate silently on checkpoint completion and data capture actions — no score visible during active journey
- [ ] #3 Minimal celebration micro-animations fire on checkpoint completion (e.g., +10 fade) — dismissable, never blocking
- [ ] #4 End-of-journey summary screen shows split times per stage/segment with actual vs target comparison
- [ ] #5 Summary screen includes timestamp override inputs — user can correct logged times using proper datetime form controls
- [ ] #6 Summary screen includes free-text notes field for bake feedback and agent improvement suggestions
- [ ] #7 Summary screen calculates total active time by excluding passive wait segments (proofing, bulk ferment, bake)
- [ ] #8 Summary output is structured JSON consumable by bake-log skill — flows directly into the review pipeline
- [ ] #9 Points categories defined but extensible — initial set covers data capture completeness and checkpoint completion
- [ ] #10 Score reveal at journey end shows total points + per-category breakdown
<!-- AC:END -->
