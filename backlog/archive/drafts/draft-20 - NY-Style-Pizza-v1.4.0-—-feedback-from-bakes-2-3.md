---
id: DRAFT-20
title: NY-Style Pizza v1.4.0 — feedback from bakes 2-3
status: Draft
assignee: []
created_date: '2026-02-19 03:40'
labels:
  - recipe
  - feedback
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Version bump incorporating proven changes from bakes 2 (2026-02-12) and 3 (2026-02-18):\n\n1. **Remove sugar** — burned at 550°F in bake 2, removed entirely in bake 3 with great results. Not needed at steel temps.\n2. **Add Parmigiano-Reggiano as ingredient** — standard build for 2 bakes now (sauce → parm → mozz → pepperoni layer order). Needs to be in ingredient list + topping directions.\n3. **Link sauce to NY Pizza Sauce recipe** — instead of generic "Raw San Marzano Tomato Sauce", link to `/recipe/ny-pizza-sauce`. Requires new `linkedRecipe` schema concept on ingredients.\n\nLinked recipe concept is new — needs a spike for schema design + GatherSection UI (clickable ingredient → navigates to linked recipe page).
<!-- SECTION:DESCRIPTION:END -->
