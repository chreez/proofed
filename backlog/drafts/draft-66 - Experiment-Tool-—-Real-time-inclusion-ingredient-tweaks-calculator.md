---
id: DRAFT-66
title: Experiment Tool — Real-time inclusion/ingredient tweaks calculator
status: Draft
assignee: []
created_date: '2026-05-01 04:07'
labels:
  - feature
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Interactive experiment panel for recipe pages. Adjust ingredient weights via sliders and see derived variables update in real-time (effective hydration, inclusion load %, moisture contribution). Outputs to scratchpad system.

## Core Concept

A read-only data panel that becomes interactive during a bake session. Not modifying the recipe — surfacing the math bakers think about, and capturing what they actually tried.

## Requirements

### Slider Interface
- Per-ingredient sliders for variable ingredients (inclusions, enrichments)
- Each slider has a note icon (matching existing scratchpad note system) for capturing why/what you changed
- Default position = recipe baseline amount
- Drag to see real-time derived variable updates

### Derived Variables (real-time)
- Base hydration (flour + water only)
- Effective hydration (+ butter water, milk, etc.)
- Inclusion hydration contribution (estimated moisture from inclusions)
- Total inclusion load (baker's %)\n- Per-inclusion baker's % breakdown\n\n### Freeform Ingredient Addition\n- Button to add an ingredient not in the recipe\n- Freeform input: name, amount, unit, estimated water content %\n- Use case: adding coffee to cinnamon bun icing, swapping jalapeño varieties, etc.\n- Added ingredients appear as sliders with the same note/adjust UX\n\n### Ingredient Variation Codification\n- Slider positions + notes = codified variation data\n- Structure: { ingredientId, baseAmount, adjustedAmount, note, waterContent% }\n- Freeform additions: { name, amount, unit, waterContentPercent, note }\n\n### Scratchpad Integration\n- Experiment data outputs to scratchpad (same system as bake-log reminders)\n- Scratchpad export includes experiment variations\n- Data feeds recipe minor version bumps (same as bake-log data)\n\n### Recipe Support\n- Recipes opt-in via a flag or schema block (e.g., experiment config listing which ingredients are variable)\n- Sensible defaults: all inclusions are variable, enrichments are variable\n\n## Data Flow\n\nexperiment slider adjustments → scratchpad capture → bake-log review → recipe version bump\n\n## Related\n- Scratchpad/reminder system (existing)\n- Bake-log skill (needs review — see note below)\n- Scaling system (interaction TBD)\n\n## Note: Bake-Log → Recipe Upgrade Pipeline\n\nCurrently unclear if bake-log skill handles the \"review experiment data → bump recipe version\" flow. If not, a separate skill or enhancement needed to offload:\n1. Review scratchpad + experiment data post-bake\n2. Decide which tweaks graduate to recipe baseline\n3. Bump minor version + changelog entry\n4. Update ingredient amounts in recipe JSON\n\n## Open Questions (spike material)\n- Should water content % for common ingredients be a shared lookup table? (jalapeños 92%, cheddar 37%, butter 15%, etc.)\n- How does this interact with the scaling system? (scaling changes base amounts, experiment adjusts from scaled base?)\n- UI placement: inline on recipe page? separate panel? drawer?\n- Should experiment data persist across sessions or reset per bake?
<!-- SECTION:DESCRIPTION:END -->
