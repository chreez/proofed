---
project: Proofed
status: active
updated: 2026-05-10
---

## Description

Personal portfolio and blog site (proofed.netlify.app) — Vue 3 + Vite recipe workflow app that doubles as proof of active work during job search.

## Current Focus

Recipe workflow features (cook logs, photo pipeline, energy-level reading modes). Also serves as living portfolio piece for resume/applications.

## Ports

- 6811: Vite dev server

## Open Threads

- DRAFT-33 pending groom
- Backlog tasks managed via backlog.md CLI

## Recent

- PF-244: /bake-log skill reads ExperimentPanel localStorage adjustments + parses bake_notes prose for ingredient deltas (`scripts/parse-note-deltas.ts`, 6 patterns), echoes each detected delta with 4-option prompt before writing cook_log[].ingredients; Mozzarella Rule enforced
- PF-245: explicit `<tbody>` wrappers in DemoPrintNav.vue's three pros/cons tables to silence Vite hydration warning
- PF-177.5: full BakeStatsBlock on BakeDetailView — Option C layout (Summary → Hero → Chart → curated Notes → collapsed Raw notes); new `key_notes` field on CookLogEntry; all 13 simple-sourdough bakes backfilled with bake_stats + confidence (9 high / 3 medium / 1 low)
- PF-180: structured fermentation chart in FOLD_1 state note with clickable source URL (Sourdough Journey V2.0 values)
- PF-177.9: compact bake stats variants A/B/C wired into CookLogSection with low-confidence fallback to recipe.bake_defaults
- PF-177.4: extended CookLogEntry with bake_stats and raw_notes fields
- PF-177.3: bake stats schema contract types (BakeStatsBlock, RecipeBakeDefaults, confidence)
- PF-182: replaced baking cadence horizontal timeline with from-scratch GitHub-style contribution calendar

## Related Projects

- resume: shares design system (stone palette, accent #a65d45, Inter font)
- @second-brain: unemployment validation — site proves continued technical work
