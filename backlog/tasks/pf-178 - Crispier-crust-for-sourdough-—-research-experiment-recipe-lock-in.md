---
id: PF-178
title: 'Crispier crust for sourdough — research, experiment, recipe lock-in'
status: To Do
assignee: []
created_date: '2026-04-08 16:54'
updated_date: '2026-04-08 17:08'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Recurring theme across the sourdough bake log is the desire for a crispier crust. Bake 11 guest feedback explicitly asked for it. Bake 12 discovered higher uncovered temp (450°F) + flipping at 9-min intervals produced the best crust so far. This parent task consolidates the research thread into an end-to-end flow: research → structured experiments → recipe lock-in.

## Known data points

- **Bake 11 (2026-04-01)** — housewarming party, guest feedback: "Someone mentioned wanting a crispier crust."
- **Bake 12 (2026-04-06)** — "Tried keeping uncovered temp higher on first loaf (didn't lower it). Crust came out really good." + "Uncovered bake: 9 min, flip, 9 min, flip, then 4 extra min with tray turned 90°. Came out even." + "Crust came out better than usual from higher uncovered temp + extra time."
- **Current baseline (v3.2.0)** — `BAKE_UNCOVERED` direction is 9 min + flip + 9 min at 425-450°F. This is the control arm.
- **Outstanding hypothesis** — Consider going up to 24 minutes uncovered at a lower temp (420°F?) for next bake to explore the lower-and-longer end of the spectrum.

## Research questions (answered by PF-178.1 spike)

- What's the actual driver of crust crispness — total energy into the crust, final surface moisture, sugar caramelization, starch gelatinization, or a combination?
- Higher temp + shorter vs. lower temp + longer — which produces a crispier crust for this dough (70% hydration, bread flour, 425-500°F range)?
- Does finishing cold (leaving the oven cracked during cooldown) help crust development?
- Does a light second-stage spritz or a splash of water extend the steam phase differently than just the Dutch oven lid?
- What's the role of internal dough temperature in final crust texture?
- How does post-bake handling (rack cooling, oven off with door cracked) affect final crust crispness?

## Hard sources to consult

- The Perfect Loaf — crust development articles
- King Arthur Baking — sourdough crust guides
- The Sourdough Journey — bake chart + crust tips
- r/Sourdough — community experiments

## Phase structure

1. **Research spike (PF-178.1)** — `/research` skill, multi-source synthesis, produces writeup + numbered experiment plan
2. **Experiment bakes (PF-178.2+)** — one subtask per experiment, created from the spike output. Each isolates exactly one variable from the v3.2.0 baseline. At least 3 bakes completed before concluding.
3. **Recipe lock-in** — winning method updates `BAKE_UNCOVERED` direction + state notes in `simple-sourdough.json`, bumps version to v3.3.0.

Parent task completes when the winning method is locked into the recipe and verified via build gate.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Research spike subtask is created as the first subtask and completed before any experiment subtasks are spawned
- [ ] #2 Research spike output produces a numbered experiment plan with 3-5 concrete experiments, each isolating one testable variable
- [ ] #3 One subtask per experiment is created from the experiment plan, each with hypothesis, isolated variable, measurement method, and pass/fail criteria
- [ ] #4 At least 3 experiment bakes are completed and logged in `public/recipes/simple-sourdough.json` `cook_log[]` before concluding a winning method
- [ ] #5 Each experiment bake's cook_log entry references its experiment subtask ID in notes
- [ ] #6 A winning method is identified in parent task implementation notes, citing which experiments support the conclusion
- [ ] #7 `BAKE_UNCOVERED` direction in `simple-sourdough.json` is updated to lock in the winning method (temp, time, flip pattern, finish-cold, etc.)
- [ ] #8 At least one `BAKE_UNCOVERED` state note is added or updated with the user-voice learning from the experiment phase
- [ ] #9 Recipe version bumps to v3.3.0 (minor) with a `change_log` entry summarizing the crust experiment findings
- [ ] #10 `npm run build` passes after the recipe update
- [ ] #11 Parent task implementation notes include a results table summarizing each experiment bake (hypothesis, result, win/loss)
<!-- AC:END -->
