---
id: PF-180
title: Structured tables in state notes
status: Done
assignee: []
created_date: '2026-04-08 16:51'
updated_date: '2026-04-10 14:23'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
State notes currently only support free text (`StateNote` type in `src/types/recipe.ts` has `text`, `critical`, `source`). Some references would be clearer as structured tables \u2014 e.g. a fermentation chart mapping dough temperature to target aliquot rise %.

## Pivot from original draft

This draft originally proposed image support in state notes. During grooming, the first use case (The Sourdough Journey V2.0 fermentation chart) was identified as copyrighted paid content, and the decision was made to create a home-made version instead. The home-made version is better served as a structured table than an image, so the draft pivoted to **table support**.

Image support in state notes is spun out as a separate draft for future consideration.

## Behavior

- `StateNote` gains an optional `table` field alongside existing `text`, `critical`, `source`
- Tables have typed cells so the renderer can reuse existing components (`TempText` for temperatures, etc.) and format numbers/percents consistently
- Tables coexist with text \u2014 `text` acts as a lead-in/caption, the table follows
- Tables support optional caption and source attribution below the body
- First use case: home-made Sourdough Journey V2.0 fermentation chart (dough temp \u2192 target rise %) in the FOLD_1 state note on `simple-sourdough`

## Visual direction

Look and feel (borders, density, alignment, mobile behavior) is chosen via a demo spike subtask, batched with the PF-177.1 stats block demo for a single user review pass.

**LOCKED 2026-04-08 — Variant B (bottom borders + zebra, editorial feel)** from PF-180.1 demo. Implementation details:
- Bottom borders only (no grid), 2px header underline
- Mono uppercase header row, subtle style
- Zebra striping via `:nth-child(odd)` on body rows
- Right-aligned numerics with monospace font
- Caption/source attribution rendered above the table
- Mobile overflow strategy: same `overflow-x: auto` wrapper approach as Variant C but with Variant B's visual styling on the table itself

## Context

- `StateStep.vue:127-138` renders state notes as simple text divs today
- The project has a reusable `TempText` component and standardized unit conventions (grams, \u00b0F with \u00b0C in parentheses)
- The FOLD_1 state on `simple-sourdough` currently references the Sourdough Journey chart in agent-authored text (simple-sourdough.json:352-357) \u2014 that text gets replaced by the structured table
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 StateNote type gains an optional table field; existing fields (text, critical, source) continue to work unchanged
- [x] #2 Table schema supports typed cells — at minimum: text, number, temperature, percent (extensible for duration, weight later)
- [x] #3 Temperature cells reuse the existing TempText component so °F/°C formatting matches the rest of the app
- [x] #4 Percent and number cells render right-aligned with monospace numerics for scannability
- [x] #5 Tables render inside the state note block in StateStep.vue when note.table is present, coexisting with note.text (text acts as lead-in/caption)
- [x] #6 Tables support optional caption and source attribution rendered below the table body
- [x] #7 A home-made version of the Sourdough Journey V2.0 fermentation chart (dough temp → target aliquot rise %) is added to the FOLD_1 state note on simple-sourdough, citing The Sourdough Journey as the source
- [x] #8 JSON schema change is backwards-compatible — existing StateNotes without a table render unchanged; all existing recipes still load without error
- [x] #9 Tables are mobile-friendly: either horizontal scroll on overflow or responsive stacking for narrow viewports
- [x] #10 Visual direction for table styling is chosen via the batched demo subtask before implementation
- [x] #11 Snapshot tests for StateStep.vue cover both table-present and table-absent rendering
<!-- AC:END -->
