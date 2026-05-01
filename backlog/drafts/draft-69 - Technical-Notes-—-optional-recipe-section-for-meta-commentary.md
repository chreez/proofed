---
id: DRAFT-69
title: Technical Notes — optional recipe section for meta-commentary
status: Draft
assignee: []
created_date: '2026-05-01 04:23'
labels:
  - feature
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Feature

New optional field in recipe JSON schema: `technical_notes`. Array of structured notes providing meta-commentary about the recipe — not tied to a specific state, but about the recipe as a whole.

## Use Cases

- "You can skip the levain build and use 100g active starter instead" (jalapeno-cheddar-sourdough)
- "This recipe works at 65-72% hydration — lower for beginners, higher for open crumb"
- Baker's percentage tables\n- Hydration analysis (base vs effective vs with inclusions)\n- Flour substitution notes\n- Equipment alternatives\n\n## Schema\n\n```typescript\ninterface TechnicalNote {\n  title: string           // e.g. \"Levain vs Active Starter\"\n  text: string            // markdown-ish content\n  category?: string       // \"substitution\" | \"hydration\" | \"technique\" | \"equipment\" | \"general\"\n}\n```\n\nRecipe JSON: `technical_notes: TechnicalNote[] | null`\n\n## Rendering\n\n- Optional section on recipe detail page\n- Only renders when `technical_notes` is non-null and non-empty\n- Collapsible? Or always visible? (spike material)\n- Placement TBD — after description, before stages? Or after stages, before cook log?\n\n## AC\n- [ ] `TechnicalNote` interface added to `src/types/recipe.ts`\n- [ ] `technical_notes` field added as optional to Recipe interface\n- [ ] Component renders technical notes when present\n- [ ] Component hidden when field is null/empty\n- [ ] At least one recipe uses the field (jalapeno-cheddar-sourdough)\n- [ ] `npm run build` passes\n- [ ] Existing recipes unaffected (field is optional)
<!-- SECTION:DESCRIPTION:END -->
