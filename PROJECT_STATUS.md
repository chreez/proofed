---
project: Proofed
status: active
updated: 2026-05-12
---

## Description

Personal portfolio and blog site (proofed.netlify.app) — Vue 3 + Vite recipe workflow app that doubles as proof of active work during job search.

## Current Focus

**DRAFT-95 Bakery Ops Assistant** — full-service local (bake + schedule + sell) is the active umbrella. Reframed from PF-255 (pricing planner) on 2026-05-12 after user surfaced the actual ambition. Pending: pick v1 spine slice (S0 Plan skeleton vs S1 rework Pricing + Plan vs other), then groom.

Background: recipe workflow features (cook logs, photo pipeline, energy-level reading modes). Also serves as living portfolio piece for resume/applications.

## Ports

- 6811: Vite dev server

## Open Threads

- **DRAFT-95** Bakery Ops Assistant — umbrella epic awaiting v1 spine grooming
- **PF-255.1 /pricing** committed (601812b) but user flagged "not shippable"; rework consolidated into DRAFT-95 S1
- 14 candidate drafts under DRAFT-95 (80–94); dedupe needed: 80⇔83, 81⇔84
- DRAFT-33 pending groom (pre-DRAFT-95)
- Backlog tasks managed via backlog.md CLI

## Recent

- DRAFT-95: reframed PF-255 narrow pricing scope into "Bakery Ops Assistant" full-service umbrella (bake + schedule + sell, local-only, agent-in-loop, accuracy-flagged); 9 candidate slices (S0–S8); PF-255 work + DRAFTs 80–94 roll up under it
- PF-255.1: pricing MVP at `/pricing` — per-recipe markup% slider (50–300%), snap-to-pretty display, live CP$/CP%, nudge-up hint, localStorage persistence + JSON export, dirty badge per row, mobile-responsive; 67 new tests + PricingRow snapshot
- PF-255 (epic): groomed + executed — 6 subtasks closed (5 spikes/designs + 1 slice). Spawned 10 follow-up drafts (DRAFT-80..89) covering recipe-metadata backfill, throughput schema, tooltips
- F43: new validation check — every interactive/jargon-bearing UI element must expose a help tooltip on hover/focus
- PF-254: hybrid tag search in header for recipes + bake log
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
