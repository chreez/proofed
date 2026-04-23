---
id: PF-227
title: 'Journey Mode P4 — Ghost mode: PB tracking + gold splits + comparison UI'
status: To Do
assignee: []
created_date: '2026-04-23 21:46'
updated_date: '2026-04-23 22:29'
labels:
  - feature
  - future
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Phase 4: Ghost Mode (Future)

Compare current bake against historical performance.

### Scope

1. **PB (Personal Best) tracking** — derive from historical bake logs per recipe
2. **Gold splits** — best individual segment times across all runs
3. **Sum of Best** — theoretical perfect bake combining all golds
4. **Comparison UI** — delta display against ghost during active journey (+/- from target per segment)
5. **Baseline seeding** — manual targets in recipe JSON initially, auto-derived after enough bakes

### Prerequisites
- Sufficient bake log history with journey timestamps
- Journey mode P1-P3 shipped and validated

### Parent: DRAFT-66
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 PB (Personal Best) derived per recipe from historical bake logs that contain journey timestamp data
- [ ] #2 Gold splits tracked — best individual segment time across all runs stored per checkpoint
- [ ] #3 Sum of Best calculated — theoretical perfect bake combining all gold splits displayed on journey summary
- [ ] #4 During active journey, delta display shows +/- from PB per segment in real-time (on component mount, not polling)
- [ ] #5 Baseline seeding supported — manual split targets in recipe JSON used as comparison when insufficient historical data exists
- [ ] #6 Auto-derived baselines kick in after a configurable minimum number of completed journeys per recipe (default: 3)
- [ ] #7 Ghost comparison UI is opt-in — user can toggle visibility during active journey without affecting data capture
- [ ] #8 Historical journey data survives recipe version bumps — comparison tracks by checkpoint ID, not recipe version
<!-- AC:END -->
