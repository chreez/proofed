---
id: PF-134
title: Cost snapshot — per-bake ingredient cost capture
status: To Do
assignee: []
created_date: '2026-02-14 02:58'
labels: []
dependencies:
  - PF-133
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ingredient-level cost input during the bake, integrated with the gather section. User selects products used → costs flow into the structured JSON output alongside bake notes (PF-133).

**Flow:**
1. At gather/ingredient level on the recipe page, optional cost input per ingredient
2. Presents known products with prices + sizes (data-driven)
3. User picks or enters "Other" with price
4. Cost data included in the structured JSON output (same blob as PF-133 scratchpad)
5. Agent summarizes total bake cost + per-serving during /feedback

**What it's NOT:**
- No AI recommendations or tips
- No inflation tracking
- No price optimization
- Just summarical data from user input
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Gather section has optional cost input per ingredient
- [ ] #2 Known products shown with name, size, and price
- [ ] #3 "Other" option for manual product + price entry
- [ ] #4 Cost data included in structured JSON output blob (shared with PF-133)
- [ ] #5 Total bake cost and per-serving cost calculated from selections
- [ ] #6 No AI recommendations — data summary only
<!-- AC:END -->
