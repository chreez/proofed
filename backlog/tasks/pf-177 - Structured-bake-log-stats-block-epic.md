---
id: PF-177
title: Structured bake log stats block (epic)
status: To Do
assignee: []
created_date: '2026-04-08 16:36'
updated_date: '2026-04-08 17:04'
labels:
  - epic
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bake log entries should be easier to read and glance at. Today, measurements and timing are buried in prose notes (e.g. "5:07pm — fold 1, 75.5°F"), making it hard to scan a bake and understand what happened.

## North star

**Glanceability.** Structure serves reading, not just capture. Timing and measurements belong in structured fields; prose `notes[]` stays for observations, judgment, and deviations. The user should be able to glance at a bake log entry and immediately see key inputs (bulk time, dough temp, weather) and top-line results without reading a wall of text.

## Epic scope

This is an umbrella epic with subtasks. The epic delivers:

1. **Per-recipe bake stats schema** — each recipe declares its own relevant field set. Sourdough tracks bulk time, S&F sequence, aliquot rise; ATK buns and pizza track different things.
2. **Structured arrays in `CookLogEntry`** — S&F sequences, bake params, aliquot tracking as first-class fields instead of prose.
3. **Stats block UI component** — compact, scannable block at the top of every cook log entry card. Visual direction chosen via demo.
4. **Weather capture in `/bake-log` skill** — estimation-only; captures weather for bulk ferment day and room-temp proof day(s) (the days fermentation is happening at room temp), not just the day the bake ends.
5. **Backfill 12 `simple-sourdough` cook log entries** — migrate all existing prose timestamps/temps/aliquot into structured fields as the exemplar.

## Out of scope (spin out as separate drafts)

- **Bake mode** (live prompt-driven capture during bakes) — deferred as a separate draft after this epic lands. The existing `useScratchpad.ts` infrastructure can be extended later to flow structured data directly into cook_log fields.
- **Backfill for other recipes** — separate per-recipe drafts for recipes with successful bake logs (ATK cinnamon buns, NY pizza, etc.).

## Context

- Current state: `CookLogEntry.notes[]` is a flat string array; `CookLogSection.vue` renders date/version/summary/counts with no stats block.
- `useScratchpad.ts` already exists as a localStorage-backed structured capture system with `StepReminder` prompts — this is the foundation bake mode will later build on.
- Exemplar pain points live in `simple-sourdough` bakes #11 and #12:
  - Bake #11 logs S&F timestamps and temps as prose ("5:07pm — fold 1, 75.5°F"), plus aliquot rise % ("60% rise") in prose
  - Bake #12 explicitly says "wasn't present enough in the process — didn't log bake temps well" — the exact case structured capture would catch

## Subtasks

- `.1` Per-recipe bake stats schema contract
- `.2` Structured S&F / bake params / aliquot arrays in `CookLogEntry`
- `.3` Stats block UI component (blocked by `.6` demo)
- `.4` Weather capture in `/bake-log` skill
- `.5` Backfill 12 `simple-sourdough` cook log entries
- `.6` Demo spike: stats block visual options (batched with DRAFT-34/35 demos)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every cook log entry card renders a compact stats block at the top summarizing key inputs and results in a scannable format
- [ ] #2 The stats block only shows fields declared by that recipe's schema — each recipe declares its own relevant field set (sourdough's schema differs from ATK buns' or pizza's)
- [ ] #3 Stretch-and-fold sequences render as a scannable structured block (fold #, timestamp, dough temp) instead of being buried in prose notes[]
- [ ] #4 Bake params render as a scannable structured block (preheat temp, covered temp + duration, uncovered temp + duration, flips, internal temp out) instead of being buried in prose notes[]
- [ ] #5 Aliquot tracking renders as a compact structured row (start %, target %, actual %) instead of being buried in prose notes[]
- [ ] #6 The /bake-log skill prompts for and captures weather estimates for bulk ferment day and any room-temp proof day(s) — estimation is acceptable, not precise data
- [ ] #7 All 12 existing simple-sourdough cook log entries are backfilled from prose into the new structured format — timing, temps, and aliquot data pulled out of prose into structured fields
- [ ] #8 After backfill, simple-sourdough notes[] arrays contain only observations and judgment (e.g. 'dough was slack', 'wasn't present enough in the process') — no more timestamped measurements like '5:07pm — fold 1, 75.5°F'
- [ ] #9 The stats block and structured blocks gracefully handle missing/partial data (recipes without declared stats schemas, older entries without structured fields)
- [ ] #10 Visual direction for the stats block is chosen via the demo subtask before the stats block UI subtask is implemented
- [ ] #11 Backfill tasks for other recipes with successful bake logs are spun out as separate drafts after sourdough backfill lands
<!-- AC:END -->
