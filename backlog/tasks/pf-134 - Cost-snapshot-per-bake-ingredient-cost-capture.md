---
id: PF-134
title: Cost snapshot - per-bake ingredient cost capture
status: Done
assignee: []
created_date: '2026-02-14 02:58'
updated_date: '2026-02-16 23:57'
labels: []
dependencies:
  - PF-133
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ingredient-level cost capture as a section within the bake review page (PF-138). User selects products used → costs flow into structured JSON output.

**Flow:**
1. During bake review, cost section iterates recipe ingredients
2. For each ingredient, search HEB via MCP → present product matches as array
3. User picks "which one did you purchase or which is closest?"
4. Price calculated from package size vs amount used in recipe
5. Bulk staples (flour, sugar, salt, yeast) use **pantry rates** — stored cost-per-gram that persists across bakes
6. Summary shows total bake cost + per-serving cost

**Two pricing modes:**
- **Fresh purchase** — HEB MCP product picker, user selects from results
- **Pantry/historical** — stored rate for bulk ingredients, updated manually when price changes

**HEB MCP server:** External at `/Users/chris/workspace/heb-mcp-server/`, configured in `.mcp.json`. Tools: `heb_store_lookup` (zip → stores) and `heb_product_search` (query + storeId → products with prices).

**What it's NOT:**
- No AI recommendations or tips
- No inflation tracking
- No price optimization
- Data summary only
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Cost section within bake review page (PF-138) iterates recipe ingredients
- [x] #2 Each ingredient searches HEB MCP and presents product matches as selectable array
- [x] #3 User picks which product they purchased — price mapped from package size to recipe amount
- [x] #4 Pantry rate mode for bulk staples — stored cost-per-gram, persists across bakes
- [x] #5 'Other' option for manual product + price entry
- [x] #6 Total bake cost and per-serving cost calculated from all selections
- [x] #7 Cost data included in structured JSON output
- [x] #8 No AI recommendations — data summary only
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Design Decisions from PF-134.2 Demo Review

- **Product picker UX:** Cards (variant B) — larger selectable cards with check mark
- **Pantry rate mode:** Approved — toggle fresh purchase vs stored rate
- **Three cost tiers:** supplies total (checkout cost), bake cost (proportional usage), per-serving cost
- Supplies total = sum of full package prices for everything purchased
- Bake cost = sum of (package price × amount used / package size) per ingredient
- Per serving = bake cost ÷ servings

Execution started as part of PF-138. Hybrid architecture chosen: agent writes HEB results to public/review-data/{recipeId}/{date}/heb-results.json, review page fetches and presents picker UI. User chose card-style product picker (Variant B from demo).
<!-- SECTION:NOTES:END -->
