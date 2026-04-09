---
id: PF-186
title: 'Spike: Indoor ambient temperature measurement reminder UX'
status: To Do
assignee: []
created_date: '2026-04-09 15:32'
labels:
  - spike
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Research the best UX pattern for prompting the baker to measure indoor ambient temperature as the very first step before every bake.

## Context
- Indoor ambient temp is the #1 variable affecting fermentation timing
- User wants to start measuring it as the first step, every single bake, no exceptions
- This is distinct from outdoor weather (separate spike)
- Currently not prompted anywhere in the recipe flow

## Options to explore
1. Add as a step/note in the recipe's first stage (e.g., "Measure kitchen temperature")
2. Fire as a StepReminder via useScratchpad when a bake session starts
3. A new "pre-bake checklist" concept that fires before stage 1
4. Something else the spike uncovers

## Recipe scoping
- New recipe-level tag (e.g., `requires_ambient_temp: true`) to flag which recipes trigger the prompt
- Most current recipes would get it, but tag keeps it configurable per recipe

## Hardware evaluation
- Ecobee thermostat API — can we query current indoor temp programmatically? Auth, accuracy, latency?
- Dedicated kitchen thermometer/hygrometer — always-on display at workstation, ideally with humidity
- Manual instant-read as fallback

## Key questions
- Where in the flow does it feel natural vs annoying?
- Should the value auto-populate `bake_stats.bulk_ambient_temps[0]`?
- Does this apply to all recipes or just fermented ones? (recipe tag controls this)
- How does it interact with the existing scratchpad/reminder system?
- Ecobee integration feasibility: API availability, auth complexity, accuracy vs dedicated sensor
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Evaluate ≥3 UX placement options for the ambient temp prompt (pre-bake checklist, scratchpad reminder, inline stage step, auto-capture); document pros/cons of each
- [ ] #2 Propose a recipe-level tag schema for flagging which recipes require ambient temp capture
- [ ] #3 Investigate Ecobee API for auto-capture: auth model, data availability, accuracy, feasibility
- [ ] #4 Recommend ≥2 dedicated kitchen thermometer/hygrometer options with price and features
- [ ] #5 Propose how captured value flows into `bake_stats` (field name, auto-populate vs manual entry)
- [ ] #6 Document interaction with existing scratchpad/reminder system
- [ ] #7 Demo subtask: mock up the top 2 UX placements in recipe page context
<!-- AC:END -->
