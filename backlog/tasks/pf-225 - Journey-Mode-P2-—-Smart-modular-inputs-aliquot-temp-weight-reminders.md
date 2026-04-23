---
id: PF-225
title: 'Journey Mode P2 — Smart modular inputs (aliquot, temp, weight, reminders)'
status: To Do
assignee: []
created_date: '2026-04-23 21:46'
updated_date: '2026-04-23 22:28'
labels:
  - feature
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Phase 2: Smart Inputs

Modular tools that appear contextually at journey checkpoints. Not every recipe uses every tool.

### Inputs (separate sub-tasks likely)

1. **Aliquot slider** — draggable 0-100%, append-only logging, fat-finger tolerant (overshoot writes new entry, no deletes). Validation deferred to bake-log step.
2. **Dough temp input** — precision 0.1°F, takes last reading, "consumed" visual feedback when logged. Ambient display of running average dough temp across all readings in journey.
3. **Weight + portion calculator** — enter total dough weight → per-unit math on the fly. Ambient display during bake.
4. **Mixed text+number parsing** — single input field handles "78.2F 42% aliquot" style entries
5. **Reminder system** — contextual nudges at checkpoint transitions ("remember to get aliquot sample!")
6. **Kitchen temp / ambient readings** — lightweight logging

### Design Constraints
- Large touch targets — messy hands on iPhone
- Modular architecture — tools are composable, recipe declares which it needs
- Every interaction → scratchpad entry
- Per-input iPhone demos before shipping

### Depends on: P1 skeleton
### Parent: DRAFT-66
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each smart input is a standalone composable/component — recipe tool declarations determine which render at each checkpoint, unused tools don't mount
- [ ] #2 Aliquot slider: draggable 0-100% range, every onChange writes a new scratchpad entry (append-only, no overwrites or deletes of previous readings)
- [ ] #3 Dough temp input: 0.1°F precision, displays last recorded reading, visual consumed feedback when a reading is logged, shows running average of all dough temp readings in current journey
- [ ] #4 Weight + portion calculator: accepts total dough weight, computes per-unit portions on the fly, result persists as ambient display during bake
- [ ] #5 Mixed text+number input: single field accepts freeform entries like 78.2F 42% aliquot — raw text stored in scratchpad, structured extraction deferred to bake-log pipeline
- [ ] #6 Reminder system: contextual nudges appear at checkpoint transitions based on recipe-defined reminder text (e.g., remember to get aliquot sample\!)
- [ ] #7 Kitchen temp / ambient readings: lightweight input that logs environment data to scratchpad with timestamp
- [ ] #8 All inputs write scratchpad entries with ISO timestamp on every interaction — no batching, no deferred writes
- [ ] #9 Touch targets meet minimum 44x44pt for all interactive elements — tested with messy-hands scenarios on iPhone
- [ ] #10 Per-input iPhone demo gate: each input type tested on device before shipping to production
<!-- AC:END -->
