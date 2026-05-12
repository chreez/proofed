---
id: PF-255
title: 'Pricing, throughput, and bake-schedule planner'
status: Draft
assignee: []
created_date: '2026-05-11 22:17'
updated_date: '2026-05-12 04:21'
labels:
  - epic
  - pricing
  - scheduler
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Idea (raw — pre-grooming)

Public-facing showcase feature: from recipe cost → suggested sell price → batch throughput → drag-to-schedule queue → profit/hour. Use proofed as a "bakery operations" demo while keeping all data file-based (no backend).

### Source conversation (2026-05-11)
User wants:
- Pricing considerations per recipe (cost of goods → sell rate)
- Admin view: visualize sales / sale% / profit% (contribution profit)
- Preliminary research on bakery pricing models
- Set sell rate per recipe + factor in time-to-make
- Throughput model: a recipe that yields 2 loaves vs cinnamon rolls (different prep/proof times); home oven = 1 bake at a time
- Drag-to-queue scheduler showing bake timeline + profit/hour calc; surfaces 2am wake-ups vs overnight cold proof tradeoffs
- Quality-vs-time tradeoff acknowledged (overnight proof improves product)
- Default values per recipe; user can override

### Q&A answers
**Q1 audience:** Could be a public feature — showcase value primarily, not auth-gated tool.

**Q2 data home:** Lean toward default pricing models with CP (contribution profit). Bulk-purchase math matters: recipe needs 500g flour but wholesaler sells in bulk → calculate break-even point on initial bulk investment. Implies pricing layer must amortize bulk-purchase capital over N future bakes.

**Q3 schedule + persistence model:**
- Modular system, but first cut hard-codes home-oven config
- "Profile" holds default values, can map to recipe IDs
- Agent-in-the-loop workflow, mirrors bake-logging pattern
- File-based, no backend — export profile as JSON payload
- UI shows current values vs saved values (diff/dirty state)
- Default profile derived from recipes already baked; eventually applies to arbitrary bakes
- One-time demo workflow: user opens UI, configures values per recipe via the tool, exports JSON "save" snapshot
- Each workflow interaction asks: overwrite default? Each entry is a unique profile; updates happen per-profile

### Scope flags (large — needs grooming + spike subtasks)
- Pricing model research (spike): bakery pricing methodologies, contribution-profit calc, bulk-amortization break-even formulas
- Throughput modeling (spike): recipe metadata for prep-active vs passive-proof time, oven occupancy windows, multi-stage resource conflicts
- Scheduler UI (spike or design): drag-to-queue interaction, multi-day timeline, overnight-proof visualization, profit/hour overlay
- Profile system (design): JSON schema, dirty-state UI, per-recipe override mapping, export/import
- Recipe metadata gaps: which existing recipes are missing time/yield/cost defaults; what defaults to seed

### Next step
Needs full /groom pass with multiple spikes before any implementation. User said "store this as an idea" — do NOT promote to To Do until clarify/intent loop is run.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 1. 6 subtasks created: 1 slice + 3 spikes + 2 designs.
- [ ] #2 2. Parent has no shippable code; closes when the slice subtask ships and all spikes/designs are marked Done or explicitly deferred.
- [ ] #3 3. Labels: epic, pricing, scheduler (ungroomed stripped).
- [ ] #4 4. Description preserves the 5 work streams from the original draft.
<!-- AC:END -->
