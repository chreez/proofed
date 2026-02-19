---
id: DRAFT-19
title: Audit nutrition servings across all recipes
status: Draft
assignee: []
created_date: '2026-02-19 03:17'
labels:
  - bug
  - nutrition
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nutrition `servings` and `servingSize` may be inconsistent. NY-Style Pizza uses servings=2 (per pizza) but actual serving is per slice (8 slices/pizza = 16 servings). Need to audit all recipes and decide on a consistent policy: per-portion (1 pizza, 1 bowl) vs per-serving (1 slice, 1 cup). May need to retroactively fix cook_log cost data too.
<!-- SECTION:DESCRIPTION:END -->
