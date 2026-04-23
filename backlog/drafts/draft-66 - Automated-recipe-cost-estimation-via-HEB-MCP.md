---
id: DRAFT-66
title: Automated recipe cost estimation via HEB MCP
status: Draft
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

**Strategy doc:** See agent output ab87cc4 for full analysis including heuristics, caching, unit conversion, and validation approach.
<!-- SECTION:DESCRIPTION:END -->
