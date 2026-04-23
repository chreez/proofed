---
id: DRAFT-66
title: Journey Mode — Gamified bake execution with speedrun splits
status: Draft
assignee: []
created_date: '2026-04-23 21:45'
labels:
  - feature
  - epic
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Concept: Speedrun Splits for Baking

**Mental Model (Speedrun → proofed.):**
- Recipe JSON = the game
- Journey = the route (checkpoint sequence with targets, decoupled from recipe)
- Bake log = the run (actual timestamps)
- PB / golds = derived from historical bake logs
- Sum of Best = theoretical perfect bake combining all gold splits

## What It Is

Active execution layer on the recipe page. Transforms passive recipe viewing into a guided, gamified bake session with smart data capture. Non-intrusive — minimizable, navigates user to correct recipe section, never blocks darting around.

## Key Systems

1. **Journey checkpoints** — step prompts → [complete] → contextual data capture → scratchpad write
2. **Smart modular inputs** (per recipe needs):
   - Aliquot slider (0-100%, append-only, fat-finger safe)
   - Dough temp (0.1°F precision, consumed feedback, running avg display)
   - Total weight → live portion calculator
   - Kitchen temp / ambient readings
   - Mixed text+number parsing
3. **Ambient displays** — avg dough temp, current aliquot, elapsed segment time (recalculated on load/unlock)
4. **Reminder system** — contextual nudges at checkpoint transitions
5. **Hidden points** — minimal celebration animations, score revealed at journey end
6. **End-of-journey summary** — split times, timestamp overrides, feedback notes → bake-log pipeline
7. **Modular tool architecture** — not every recipe uses every tool
8. **Multi-bake concurrent** — scratchpads already support this
9. **Scratchpad as source of truth** — every UI interaction writes scratchpad entries

## Constraints

- Must work with messy hands on iPhone
- Checking recipe items ≠ journey completion (recipe checkboxes = declutter, journey = canonical progress)
- Journey component minimizable, always shows current step + stage
- Demo-gated at each phase — iPhone testing before committing patterns
- Timestamps derived passively from scratchpad, no foreground stopwatch

## Phases

See subtasks for phase breakdown:
- Phase 0: Spike + Research
- Phase 1: Skeleton Journey
- Phase 2: Smart Inputs (modular)
- Phase 3: Ambient Displays + Gamification
- Phase 4: Ghost Mode (future)
<!-- SECTION:DESCRIPTION:END -->
