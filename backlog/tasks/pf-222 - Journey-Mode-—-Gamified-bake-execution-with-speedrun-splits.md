---
id: PF-222
title: Journey Mode — Gamified bake execution with speedrun splits
status: To Do
assignee: []
created_date: '2026-04-23 21:45'
updated_date: '2026-04-23 21:55'
labels:
  - feature
  - epic
dependencies: []
priority: high
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A journey schema block exists in the Recipe type definition, decoupled from but referencing recipe stages/steps
- [ ] #2 Journey checkpoints derive elapsed times from scratchpad timestamps — no foreground stopwatch or persistent timer process
- [ ] #3 Journey UI component is minimizable, always displays current stage + step, and navigates to the correct recipe section on advance
- [ ] #4 Recipe checkbox progress (useProgress) remains independent from journey checkpoint progress — checking items to declutter does not advance the journey
- [ ] #5 Smart input tools (aliquot, temp, weight, etc.) are modular composables — recipes declare which tools they need, unused tools don't render
- [ ] #6 Every journey UI interaction writes a scratchpad entry with ISO timestamp
- [ ] #7 Multi-bake concurrency works — multiple active journeys (via separate scratchpads) don't conflict
- [ ] #8 End-of-journey summary produces structured data consumable by the bake-log skill pipeline
- [ ] #9 Each phase (P0-P3) passes an iPhone demo gate before committing to production patterns
- [ ] #10 Ghost mode (P4) is documented but deferred — no implementation required for epic completion
- [ ] #11 The speedrun mental model (game/route/run/PB/golds) is documented as a conceptual reference in the codebase
<!-- AC:END -->
