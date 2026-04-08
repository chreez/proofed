---
id: DRAFT-33
title: 'Structured bake log stats block (bulk time, dough temp, weather)'
status: Draft
assignee: []
created_date: '2026-04-08 16:36'
updated_date: '2026-04-08 16:37'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bake log notes should follow a uniform structure, and every bake log entry should have a stats block at the top summarizing the bake.

## North star

**Reproducibility.** The point of logging bake data is being able to re-run a successful bake. Today, reconstructing "what actually happened" means scrolling through prose notes and trying to piece together temps, timings, and observations. That's lossy and slow. Every step should be easy to read at a glance.

## Stats block (top of every sourdough bake log)

- Total bulk proof time
- Total proof time after shaping (room-temp rest + cold retard)
- Total time taken (mix → out of oven)
- Average dough temperature (derived from tracked S&F temps)
- Average outside temperature on bake day (Austin, TX for now)

Some of these can be derived from existing timestamped notes. Others (weather) may need MCP support for a weather-lookup tool.

## Structured formats for repeated patterns

Beyond the stats block, recurring patterns in bake log notes should have a dedicated structured format instead of being flattened into prose notes. Examples from sourdough logs:

- **Stretch & fold sequence** — currently captured as 3-4 separate timestamped notes with dough temps (e.g. "5:07pm — fold 1, 75.5°F"). Could be a structured array: `{ number: 1, time: "17:07", dough_temp_f: 75.5 }` rendered as a clean table in the UI.
- **Bake steps** — preheat temp, covered temp, covered duration, uncovered temp, uncovered duration, flip intervals, internal temp out of oven
- **Aliquot tracking** — start %, target %, actual rise % at end of bulk

The goal: cook log notes that aren't "measurements dressed as prose" should be treated as structured data. Prose stays for judgment, observation, and reflection.

## "Bake mode" — active capture during the bake

Related idea: a dedicated mode on the recipe page that prompts for inputs as the bake progresses. Instead of relying on memory to log temps after the fact, bake mode would:

- Ask for preheat temp when the PREHEAT state starts
- Ask for covered temp / duration at BAKE_COVERED
- Ask for uncovered temp / duration at BAKE_UNCOVERED
- Capture dough temp entries during each stretch & fold
- Capture aliquot measurements
- Auto-timestamp every entry

This addresses the pain point from bake #12 — "wasn't present enough in the process — didn't log bake temps well." Bake mode makes logging a prompt-driven checklist, not a memory exercise. At the end, the captured data flows straight into the structured cook_log entry.

## Broader questions to groom

- What does "uniform structure" mean for bake log notes? Sections? Required fields? Timestamp format?
- Which patterns deserve structured formats vs. staying as free-text notes?
- How does this generalize beyond sourdough to other recipes (pizza, cinnamon buns, etc.)?
- Does the recipe JSON schema need new fields (e.g. `cook_log[].stats`, `cook_log[].stretch_and_folds[]`, `cook_log[].bake_params`)?
- Does the UI need new renderers for structured stat blocks?
- What's the scope split — stats block, structured formats, bake mode. One task or three?
- Bake mode UX: inline on recipe page, separate route, or modal? How does state persist mid-bake (localStorage? auto-save to JSON)?

This is a draft — needs clarify loop before it becomes a PF- task.
<!-- SECTION:DESCRIPTION:END -->
