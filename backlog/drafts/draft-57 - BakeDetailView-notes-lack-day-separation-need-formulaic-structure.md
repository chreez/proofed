---
id: DRAFT-57
title: 'BakeDetailView: notes lack day separation, need formulaic structure'
status: Draft
assignee: []
created_date: '2026-04-10 18:02'
labels:
  - ux
dependencies: []
references:
  - src/components/BakeDetailView.vue
  - public/recipes/simple-sourdough.json (cook_log 2026-04-10)
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From bake 15 (2026-04-10) review:

Notes section renders as a flat bullet list with no logical separation between days. For multi-day bakes (mix day 1, bake day 2), the notes run together and are confusing to read.

Should have a more formulaic, consistent structure — e.g., day headers, chronological grouping, or visual separators between bake phases/days. The current approach relies on the user embedding timestamps in note text, but the rendering doesn't leverage those for structure.

Reference bake: simple-sourdough 2026-04-10 (15 notes spanning Apr 9 mix → Apr 10 bake)
<!-- SECTION:DESCRIPTION:END -->
