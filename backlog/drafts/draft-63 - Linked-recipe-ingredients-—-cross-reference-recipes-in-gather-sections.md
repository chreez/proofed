---
id: DRAFT-63
title: Linked recipe ingredients — cross-reference recipes in gather sections
status: Draft
assignee: []
created_date: '2026-04-12 17:07'
labels:
  - schema
  - feature
dependencies: []
references:
  - public/recipes/ny-style-pizza.json
  - public/recipes/ny-pizza-sauce.json
  - src/components/GatherSection.vue
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a `linkedRecipe` field to ingredient schema so gather section items can reference other recipes in the system. Clicking a linked ingredient navigates to the referenced recipe page.

**Primary use case:** NY-style pizza lists "Raw San Marzano Tomato Sauce" as an ingredient — should link to `/recipe/ny-pizza-sauce` so the user can jump to the sauce recipe from the pizza gather section.

**Needs:**
- Schema addition: `linkedRecipe` field on ingredient objects (recipe ID reference)
- GatherSection UI: render linked ingredients as clickable, navigating to the referenced recipe
- Validation: linked recipe IDs must resolve to existing recipes in index.json

Spun out from DRAFT-20 (NY-Style Pizza v1.4.0 feedback) — the other two items from that draft (remove sugar, add parm) already shipped.
<!-- SECTION:DESCRIPTION:END -->
