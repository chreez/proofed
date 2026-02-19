---
id: DRAFT-22
title: Improve reheat instruction formatting
status: Draft
assignee: []
created_date: '2026-02-19 03:59'
labels:
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reheat detail text renders as a wall of text — especially bad for multi-step methods like skillet steam. Need a structured format.\n\nTwo options identified:\n- **A: Markdown in detail** — store as bullet points in the string, render with `marked.parse()` (already imported in BakeDetailView). No type change.\n- **B: Add steps[] to ReheatMethod** — structured `steps: string[]` field, render as `<ol>`. More "proofed." but requires type change + migration across all recipes.\n\nAffects: BakeDetailView shared popover, potentially recipe page reheat display.
<!-- SECTION:DESCRIPTION:END -->
