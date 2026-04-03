---
id: DRAFT-32
title: Simple Sourdough v3.0.0 — codify evolved technique + audit input UX
status: Draft
assignee: []
created_date: '2026-04-03 01:10'
labels:
  - recipe-update
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Comprehensive recipe update to capture 11 bakes worth of evolved technique that has diverged from the written recipe. The recipe is now used as guidance/checklist by an experienced baker — the UX should reflect that.

## Pillar 1: Recipe Procedure Update

The written recipe (v2.1.0) is missing several steps that have become standard practice:

- **Fermentolyse**: Delayed salt addition (~30 min after initial mix). Standard since bake #6 (2026-03-01). Recipe currently says "combine all ingredients" in one step.
- **Aliquot jar**: Not mentioned anywhere in recipe. Used since bake #4 (2026-02-20) to track bulk ferment rise %. Targeting 30-60% depending on dough temp.
- **Room temp rest after shaping**: ~1 hour settle at room temp, then stitch for tension, then into fridge. Recipe currently goes straight from shape → basket → fridge.
- **No-linen banneton**: Confirmed better results across bakes #7-11. Recipe still mentions "towel-lined proofing baskets."
- **Fix DIVIDE weight**: Says ~480g each — wrong for 2-loaf recipe (total dough ~1920g, each half ~960g). Bug from v1 single-loaf days.
- **Sequential bake procedure**: Re-preheat 500°F for 30 min between loaves. Flip second loaf at ~15 min for even browning. Not documented.
- **Fermentolyse water hold-back**: Some bakes held back 25g water for salt incorporation. Consider standardizing.

## Pillar 2: Input Mechanism Audit

User has recipe mostly memorized after 11 bakes. The app is guidance + checklist + structured note capture now. Audit:

- Are `reminders` (dough temp, weigh, fermentation check) being used? Cook log data suggests they're often skipped.
- Should reminders evolve into optional checklists rather than mandatory prompts?
- The structured timestamped input (step notes from the app) is working great — preserve and improve that flow.
- Consider whether the step-by-step progression still fits or if a "dashboard" mode would serve experienced bakers better.

## Pillar 3: Mobile Viewport Zoom Bug

Separate from PF-164 (notes popover overflow, Done). When tapping a note input on iPhone, the page zooms in and doesn't restore the viewport. User must manually pinch to zoom back out. Likely iOS Safari auto-zoom on input focus when font-size < 16px. Investigate all input elements in ScratchpadNote, GeneralNotesFab, and any other mobile-facing text inputs.
<!-- SECTION:DESCRIPTION:END -->
