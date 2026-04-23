---
id: PF-214
title: Automated recipe cost estimation via HEB MCP
status: Done
assignee: []
created_date: '2026-04-23 03:54'
labels:
  - cost
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a `/cost` skill that estimates recipe cost without requiring a bake session.

**Three-tier resolution cascade:**
1. Stored rates (cost-rates.json) — pantry staples, no network
2. HEB product search (MCP) — live price lookup, cheapest HEB-brand heuristic
3. Fallback — $0.00 with manual flag

**Phases:**
- Phase 1: `/cost <recipe-id>` skill outputs JSON to terminal
- Phase 2: Pre-populate bake review selections from estimates
- Phase 3: Recipe-level baseline cost field (if needed)

**Also includes:**
- `--refresh-rates` to update cost-rates.json from current HEB prices
- Expand cost-rates.json from 7 to ~20 common ingredients
- Validate estimates against existing bake cost data

**Scope:** Estimation engine + storage only. No UI changes. Cost source dropdown UI is a separate task.

**Strategy doc:** See agent output ab87cc4 for full analysis including heuristics, caching, unit conversion, and validation approach.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `/cost <recipe-id>` skill exists, reads recipe JSON, iterates all `stages[].gather.ingredients[]`
- [x] #2 Consolidates duplicate ingredients across stages (e.g., butter in dough + glaze = total butter)
- [x] #3 Resolution cascade: check `cost-rates.json` first → HEB product search fallback → `$0.00` with `manual` flag if both fail
- [x] #4 HEB fallback auto-selects cheapest per-unit in-stock product (no user interaction)
- [x] #5 Writes `estimatedCost` to recipe JSON as top-level field — shape matches CookLogCost (total, perServing, servings, items[])
- [x] #6 Each `estimatedCost.items[]` entry includes sourceType (`rate` | `heb` | `manual`), sourceName, ingredient amount, and cost
- [x] #7 `estimatedCost` includes `estimatedAt` date field (ISO date string) for staleness tracking
- [x] #8 Servings derived via existing `getServings()` priority: `nutrition.servings` → `config.stats` → 1
- [x] #9 `/cost <recipe-id> --refresh-rates` searches HEB for each entry in `cost-rates.json`, updates rate to cheapest per-unit in-stock product, writes updated file
- [x] #10 Skill outputs summary table to terminal: ingredient, source, cost — plus total and per-serving
- [x] #11 Recipe JSON written only after skill completes successfully — no partial writes
- [x] #12 No UI changes — estimation engine and storage only
- [x] #13 Skill is agent-invocable (other skills/agents can call `/cost` programmatically)
- [x] #14 After skill is built, run `/cost` sequentially on every recipe in index.json to populate `estimatedCost` across the full catalog
<!-- AC:END -->
