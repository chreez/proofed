---
project: Proofed
status: active
updated: 2026-05-14
---

## Description

Personal portfolio and blog site (proofed.netlify.app) — Vue 3 + Vite recipe workflow app that doubles as proof of active work during job search.

## Current Focus

**PF-256 Bakery Ops Assistant** — full-service local (bake + schedule + sell). Umbrella epic with 9 candidate slices (S0–S8). **PF-256.1 shipped** 2026-05-14: `/production` route with library grid (search + sort + keyboard nav) + sticky cart sidebar (qty stepper, yield override, provenance). PF-256.2 demo spike closed (B / Cart pattern locked). Next: S2 Labels / S3 Inventory / S1 Pricing rework / S0.1 agent skill.

Background: recipe workflow features (cook logs, photo pipeline, energy-level reading modes). Also serves as living portfolio piece for resume/applications.

## Ports

- 6811: Vite dev server

## Open Threads

- **PF-255.1 /pricing** committed (601812b) but flagged "not shippable"; rework consolidated into PF-256 S1
- 13 candidate drafts under PF-256 (80–94, minus 95/97); dedupe needed: 80⇔83, 81⇔84
- DRAFT-96 (recently viewed), DRAFT-99 (cart reorder), DRAFT-33 — pending groom
- Backlog tasks managed via backlog.md CLI

## Recent

- PF-256.1: `/production` route shipped — library grid (search + sort by most-baked + keyboard nav j/k/Enter//) + sticky cart sidebar (qty stepper, yield override via dbl-click, provenance per entry); hero thumbs from cook_log; scroll-isolated viewport; minimized header
- PF-256.2: demo spike — 3 desktop layout demos (Trello/Cart/Dock) at `public/demo/production-*.html`; Cart pattern locked
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
