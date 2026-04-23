---
id: DRAFT-67
title: 'Journey Mode P0 — Spike: recipe structure audit + data model design'
status: Draft
assignee: []
created_date: '2026-04-23 21:45'
labels:
  - spike
  - research
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Phase 0: Spike + Research

Research and design spike before any implementation.

### Scope

1. **Recipe structure audit** — analyze confit garlic rolls + 2 other recipes (pick varying complexity) for stage/parallelization gaps. Can current stage definitions support split tracking? What needs to change?
2. **Data model spike** — design journey schema:
   - Where checkpoints live (attribute on stages vs separate block)
   - Split target format
   - Tool declarations per step (which smart inputs appear)
   - How journey relates to but decouples from recipe stages
3. **Scratchpad integration** — how timestamps currently flow, what is capturable today without new UI
4. **Speedrun conceptual doc** — the game/route/run/PB/golds translation table as living reference in codebase
5. **Existing landscape** — DRAFT-59 (bake mode), PF-177 (stats block), PF-116 (timers) — what can be reused

### Output
- Schema proposal for journey checkpoints
- Audit of 3 recipes with gap analysis
- Recommendation on checkpoint granularity (stage-level vs step-level vs flexible)

### Parent: DRAFT-66
<!-- SECTION:DESCRIPTION:END -->
