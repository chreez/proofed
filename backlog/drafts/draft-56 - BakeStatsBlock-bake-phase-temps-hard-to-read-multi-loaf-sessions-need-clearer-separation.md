---
id: DRAFT-56
title: >-
  BakeStatsBlock: bake phase temps hard to read, multi-loaf sessions need
  clearer separation
status: Draft
assignee: []
created_date: '2026-04-10 18:02'
labels:
  - ux
  - bug (styling)
dependencies: []
references:
  - src/components/BakeStatsBlock.vue
  - public/recipes/simple-sourdough.json (cook_log 2026-04-10)
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From bake 15 (2026-04-10) review:

1. **Right-aligned temps** — temperature values in the bake phase section are right-aligned, making them hard to scan on desktop. May work better on mobile but needs review.

2. **Multi-loaf distinction** — when a bake has two loaves with different bake profiles (e.g., loaf 1 at 450°F uncovered vs loaf 2 at 425°F), the bake phases section doesn't clearly show these are separate bake sessions. Should make it obvious which phases belong to which loaf.

Reference bake: simple-sourdough 2026-04-10 (5 bake phases: 1 preheat + 2 per loaf)
<!-- SECTION:DESCRIPTION:END -->
