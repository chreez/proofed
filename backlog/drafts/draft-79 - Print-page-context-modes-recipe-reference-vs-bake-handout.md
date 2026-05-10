---
id: DRAFT-79
title: "Print page context modes: recipe reference vs bake handout"
status: Draft
created_date: '2026-04-23 21:15'
labels:
  - ux
  - feature
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Print page currently shows recipe-level ingredients on page 1 but allows swapping to bake-specific cost data via the cost dropdown. This creates a mismatch — bake cost may reflect different quantities (single loaf vs full batch) or include optional ingredients not in the base recipe.

Two use cases exist for the same print page:
- **Recipe reference**: canonical recipe with standard estimated cost. Version-pinned, no variation.
- **Bake handout**: "here's what I made on Apr 16 and what it cost." Bake-specific ingredients, quantities, optional additions.

Need a context mode on the existing print page (not a second route) that keeps ingredients and cost in sync based on whether the user is printing for a recipe reference or a specific bake.

Considerations:
- Per-bake cost items may not map 1:1 to recipe ingredient list
- Optional/added ingredients in a bake won't appear in base recipe nutrition
- Cost per-gram/unit from a bake could be reverse-mapped to recipe ingredient quantities
- Version drift: bake was done on v1.2 but recipe is now v1.5
<!-- SECTION:DESCRIPTION:END -->
