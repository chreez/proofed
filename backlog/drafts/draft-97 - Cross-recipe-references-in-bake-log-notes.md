---
id: DRAFT-97
title: Cross-recipe references in bake-log notes
status: Draft
assignee: []
created_date: '2026-05-14 03:31'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cook_log notes currently render as plain text in BakeDetailView (`<pre>{{ entry.notes.join('\n') }}</pre>`). When a bake uses a component recipe (e.g., tartine-lemon-cream-tart topped with lime-chantilly), there's no first-class way to link out to the referenced recipe page. Plain text `/recipe/lime-chantilly` in notes is not clickable.

Possible approaches:
- Render notes as markdown (broad scope — affects all notes everywhere)
- New `relatedRecipes[]` field on CookLogEntry: array of {id, role} (e.g., role: 'topping', 'filling', 'side') — renders as a 'Paired with' chip section
- Tokenize `/recipe/<id>` paths in plain-text notes and turn them into router-links during render (narrow scope)

Triggered by: 2026-05-13 tartine-lemon-cream-tart bake topped with lime-chantilly v1.0.0 — wanted to link to lime-chantilly recipe from the tartine bake detail page, no schema/UI support exists.
<!-- SECTION:DESCRIPTION:END -->
