---
id: DRAFT-69
title: 'Journey Mode P2 — Smart modular inputs (aliquot, temp, weight, reminders)'
status: Draft
assignee: []
created_date: '2026-04-23 21:46'
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
