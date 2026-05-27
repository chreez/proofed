---
id: DRAFT-121
title: >-
  Capture starter composition on recipes + bakes; derive wheat allergen +
  nutrition from it
status: Draft
assignee: []
created_date: '2026-05-27 21:22'
labels:
  - ungroomed
  - sourdough
  - allergen
  - schema
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Why

Sourdough recipes currently have no field to declare what starter was used (composition, hydration). This is a problem for:

1. **Resale labeling**: a "100% white flour" claim becomes false if the starter is 50/50 AP+WW. The starter's wheat content needs to flow through to allergen + nutrition derivation.
2. **Cook log accuracy**: a 50/50 AP+WW starter behaves differently than a 100% white starter (faster ferment, more sour, more nutty). Bakers should record what they actually used.
3. **Edge case — non-bread recipes using sourdough discard** (pancakes, crackers, thickeners): the starter is the *sole* gluten contributor. Easy to miss when deriving allergens.

## Surfaced from

Research session for `tartine-walnut-currant-sourdough` (2026-05-27). User flagged that whole-wheat starter introduces a wheat allergen edge case to recipes that might not otherwise be wheat-based, and that this should be a "specific/special case gate" confirmed during bake-log or recipe creation.

## Scope sketch

- New optional field on Recipe JSON: `starter` block with `composition` (flour blend), `hydration` (%), notes
- New optional field on cook_log entries: `starterUsed` (overrides recipe default)
- Bake-log skill prompts "what starter did you use?" if recipe declares a starter
- Allergen derivation reads from starter composition
- Nutrition derivation reads from starter composition (whole wheat adds fiber, micronutrients)
- Print page / allergen UI surfaces "starter: X" when present

## Status: ungroomed

This is an idea draft. Needs intent translation + AC writing before promotion to PF-X. Tag for `/groom` session.
<!-- SECTION:DESCRIPTION:END -->
