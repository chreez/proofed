---
id: PF-231
title: Experiment Tool — Real-time inclusion/ingredient tweaks calculator
status: To Do
assignee: []
created_date: '2026-05-01 04:07'
updated_date: '2026-05-01 05:03'
labels:
  - feature
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Interactive experiment panel for recipe pages. Adjust ingredient weights via sliders and see derived variables update in real-time (effective hydration, inclusion load %, moisture contribution). Persists locally + exports to bake-log data.

## Core Concept

A read-only data panel that becomes interactive during a bake session. Not modifying the recipe — surfacing the math bakers think about, and capturing what they actually tried.

## Decisions (from grooming)

- **Opt-in per recipe** — recipe JSON config flag enables experiment panel
- **Shared water content lookup table** — separate JSON file with common ingredient moisture data
- **Persist + export** — experiment state persists in localStorage AND exports to bake-log data
- **UI placement** — spike subtask to explore options (collapsible section vs drawer vs overlay)
- **Recipe creation/update flows** — should populate experiment config for opted-in recipes

## Acceptance Criteria

- [ ] Recipe JSON schema supports opt-in experiment config (`experiment` block on Recipe interface)
- [ ] Recipes with `experiment` config render interactive experiment panel on recipe page
- [ ] Recipes without `experiment` config show no experiment UI
- [ ] Per-ingredient sliders for variable ingredients — default position = recipe baseline amount
- [ ] Sliders update derived variables in real-time: base hydration, effective hydration, inclusion load %, per-inclusion baker's %
- [ ] Shared water content lookup table (separate JSON) provides moisture data for common ingredients
- [ ] Freeform ingredient addition — user can add ingredients not in recipe (name, amount, unit, water content %)
- [ ] Freeform additions appear as sliders with same adjust/note UX
- [ ] Experiment state persists in localStorage across sessions (alongside scratchpad)
- [ ] Experiment data exports to bake-log data when scratchpad is exported
- [ ] Each slider has note capture (consistent with existing scratchpad note UX)
- [ ] Recipe creation skill populates experiment config for opted-in recipes
- [ ] Recipe update flows (feedback, bake-log) consider experiment config
- [ ] `npm run build` passes

## Subtasks

- PF-231.1: Spike — water content lookup table + experiment schema design
- PF-231.2: Spike — experiment panel UI/placement exploration (demo page)
- PF-231.3: Implement — hydration math engine composable
- PF-231.4: Implement — experiment panel UI + scratchpad integration
<!-- SECTION:DESCRIPTION:END -->
