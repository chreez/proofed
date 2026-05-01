---
id: PF-233
title: Technical Notes — optional recipe section for meta-commentary
status: To Do
assignee: []
created_date: '2026-05-01 04:23'
updated_date: '2026-05-01 05:32'
labels:
  - feature
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New optional field in recipe JSON schema: technical_notes. Array of structured notes providing meta-commentary about the recipe — not tied to a specific state, but about the recipe as a whole.

## Use Cases

- "You can skip the levain build and use 100g active starter instead" (jalapeño cheddar sourdough)
- "This recipe works at 65-72% hydration — lower for beginners, higher for open crumb"
- Baker's percentage tables
- Hydration analysis
- Flour substitution notes
- Equipment alternatives

## Decisions (from grooming)

- **Placement**: after description, before stages
- **Collapse**: collapsible, default closed

## Acceptance Criteria

- [ ] TechnicalNote interface added to src/types/recipe.ts with title (string), text (string), category? (enum: substitution, hydration, technique, equipment, general)
- [ ] technical_notes?: TechnicalNote[] | null field added to Recipe interface
- [ ] TechnicalNotesSection component renders technical notes when present
- [ ] Component hidden when field is null, undefined, or empty array
- [ ] Section placed after description, before stages on recipe page
- [ ] Section collapsible, default closed
- [ ] TOC sidebar includes Technical Notes entry when section is present
- [ ] At least one recipe uses the field (jalapeño cheddar sourdough — levain vs active starter note)
- [ ] Existing recipes unaffected (field is optional)
- [ ] npm run build passes
<!-- SECTION:DESCRIPTION:END -->
