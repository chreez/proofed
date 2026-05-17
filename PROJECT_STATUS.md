---
project: Proofed
status: active
updated: 2026-05-17
---

## Description

Personal portfolio and blog site (proofed.netlify.app) — Vue 3 + Vite recipe workflow app that doubles as proof of active work during job search.

## Current Focus

**PF-256 Bakery Ops Assistant** — full-service local (bake + schedule + sell). 3 slices shipped on top of the foundation: **PF-256.1** (/production plan skeleton), **PF-256.3** (/labels lens — printable 4×6 stickers w/ allergens + nutrition + QR), **PF-256.4** (/pricing rework reading ProductionPlan — decimal pricing + sell-price override + estimated-sold + break-even). Next candidates: S0.1 agent skill, S3 inventory (PF-268 design ready), S4 scheduler MVP, S6 sell log, S5 data health.

Background: recipe workflow features (cook logs, photo pipeline, energy-level reading modes). Also serves as living portfolio piece for resume/applications.

## Ports

- 6811: Vite dev server

## Open Threads

- **PF-255.1 /pricing** committed (601812b) but flagged "not shippable"; rework consolidated into PF-256 S1
- PF-256 design tasks awaiting sign-off: PF-268 (inventory), PF-269 (multi-baker), PF-270 (passive batching), PF-271 (observed times). Each spawned 4-6 follow-up implementation drafts (DRAFT-100..111).
- DRAFT-96 (recently viewed), DRAFT-99 (cart reorder), DRAFT-33 — pending groom
- Backlog tasks managed via backlog.md CLI

## Recent

- PF-259: scratchpad export JSON now includes `experimentExport` block (full `ExperimentExport` shape: adjustments + derivedValues + multiplier + scaleMode) when ExperimentPanel has non-default values; key fully omitted otherwise. Closes the PF-244 silent-apply gap — /bake-log no longer has to verbally re-ask for dialed amounts. New `buildCurrentExport()` on `useExperimentStorage`; threaded through `useScratchpad.exportJson/exportJsonString`. 11 new unit tests, 2703 total pass.
- PF-256.4: /pricing rework on ProductionPlan — decimal sell prices + pretty hint (≈$X.50/whole), per-recipe estimated-sold input, break-even line, sell-price override via double-click (mirrors /production yield-override), markup cap 1500%, cost-per-unit bug fix (was halving for batches>1). Tooltip teleports to body (escapes scroll container). 2537 tests pass.
- PF-256.3: /labels lens shipped — printable 4×6 cards per ProductionPlan entry (recipe name + batch/unit + date + allergens FDA Big 9 + ingredient list + per-serving nutrition + QR to /recipe/:id); print → browser PDF
- PF-268/269/270/271: design wave for remaining PF-256 slices — ingredient inventory (S3); multi-baker shift mgmt (S8); passive-time batching solver (S8); observed step times + per-state worker capacity (S5/S8). Each design doc + ACs + spawned implementation drafts (12 new drafts total).
- PF-261/262/263/264/265/266/267: streamlined backfill wave — D4 timer audit (6 fixes across 3 recipes); nutrition for 5 un-nutritioned recipes; cost.items refresh on 5 recipes (100% HEB-sourced); config.stats backfill on 7 recipes (3 new top-level groups: Cookies & Bars / Crackers & Snacks / Tarts & Pies); RecipeStats.itemsPerBatch field + 9 backfills; estimatedCost seed for lime-chantilly (only un-seeded); RecipeMeta throughput fields (prep_active_min, proof_passive_min, oven_occupancy_min, bake_min) on all 27 recipes
- PF-256.1: `/production` route shipped — library grid (search + sort by most-baked + keyboard nav j/k/Enter//) + sticky cart sidebar (qty stepper, yield override via dbl-click, provenance per entry); hero thumbs from cook_log; scroll-isolated viewport; minimized header
- PF-256.2: demo spike — 3 desktop layout demos (Trello/Cart/Dock) at `public/demo/production-*.html`; Cart pattern locked
- DRAFT-95: reframed PF-255 narrow pricing scope into "Bakery Ops Assistant" full-service umbrella (bake + schedule + sell, local-only, agent-in-loop, accuracy-flagged); 9 candidate slices (S0–S8); PF-255 work + DRAFTs 80–94 roll up under it
- PF-255.1: pricing MVP at `/pricing` — per-recipe markup% slider (50–300%), snap-to-pretty display, live CP$/CP%, nudge-up hint, localStorage persistence + JSON export, dirty badge per row, mobile-responsive; 67 new tests + PricingRow snapshot
- PF-255 (epic): groomed + executed — 6 subtasks closed (5 spikes/designs + 1 slice). Spawned 10 follow-up drafts (DRAFT-80..89) covering recipe-metadata backfill, throughput schema, tooltips
- DRAFT-89: `<HelpTooltip>` Vue primitive shipped + retrofitted across PricingRow/View, ProductionLibraryRow/CartEntry/View; F43 checklist updated to name component as canonical
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
