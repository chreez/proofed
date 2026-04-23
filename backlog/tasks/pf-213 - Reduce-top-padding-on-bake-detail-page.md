---
id: PF-213
title: Reduce top padding on bake detail page
status: Done
assignee: []
created_date: '2026-04-23 17:25'
labels:
  - bug (styling)
priority: Low
dependencies: []
---

## Description

Too much negative space between header and content on bake detail page. Main container gets `py-6` (top+bottom) but should get `pb-6` only (matching index/bake-log/stats pages).

## Fix

Add `showBakeDetail` to the conditional in `App.vue` line 492 so bake detail pages only get bottom padding.
