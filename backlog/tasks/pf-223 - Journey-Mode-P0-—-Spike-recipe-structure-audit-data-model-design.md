---
id: PF-223
title: 'Journey Mode P0 — Spike: recipe structure audit + data model design'
status: Done
assignee: []
created_date: '2026-04-23 21:45'
updated_date: '2026-04-23 22:19'
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Three recipes audited for journey readiness: confit garlic rolls, simple sourdough, ATK cinnamon buns — each with a gap analysis documenting what stage/step/parallelization changes are needed
- [ ] #2 Journey checkpoint schema proposed as a TypeScript interface with: checkpoint ID, step reference, split target duration, tool declarations, and reminder text
- [ ] #3 Schema proposal addresses where checkpoints live (stage-level attribute vs separate recipe block vs hybrid) with rationale for chosen approach
- [ ] #4 Tool declaration format defined — how a recipe declares which smart inputs (aliquot, temp, weight, etc.) appear at which checkpoints
- [ ] #5 Scratchpad integration documented — how existing timestamp data flows into split time derivation, what new entry types are needed
- [ ] #6 Speedrun → proofed conceptual doc written and placed in codebase (game/route/run/PB/golds translation with concrete baking examples)
- [ ] #7 Existing work inventory — DRAFT-59 (bake mode), PF-177 (stats block), PF-116 (timers) reviewed with explicit reuse/supersede/complement decisions
- [ ] #8 Recommendation on checkpoint granularity delivered with trade-off analysis (coarse vs fine vs flexible)
- [ ] #9 All findings documented in spike notes file (backlog/tasks/pf-223-spike-notes.md)
- [ ] #10 User has reviewed findings before spike is closed
<!-- AC:END -->
