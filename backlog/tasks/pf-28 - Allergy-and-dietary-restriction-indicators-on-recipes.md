---
id: PF-28
title: Allergy and dietary restriction indicators on recipes
status: To Do
assignee: []
created_date: '2026-02-06 20:25'
updated_date: '2026-02-07 02:15'
labels:
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Show allergy/dietary info per recipe. Add allergens[] and dietary[] arrays to recipe meta JSON. Manual tagging per recipe (no auto-detection for now).\n\nDisplay as badges on recipe card (index page) and recipe header. Common values: contains-gluten, contains-dairy, contains-eggs, contains-nuts, etc.\n\nNeeds spike on: FDA Big 9 allergen list, display pattern (badges vs icons vs warning), index page filtering.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe JSON schema supports allergens[] and dietary[] in meta
- [ ] #2 FDA Big 9 allergens: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soybeans, sesame
- [ ] #3 Dietary labels: vegetarian, vegan, gluten-free, dairy-free
- [ ] #4 allergens[] and dietary[] are REQUIRED fields on every recipe
- [ ] #5 Programmatic validation: /validate fails if any recipe missing allergens/dietary
- [ ] #6 Agentic check: agent cannot mark recipe task Done if allergens/dietary not populated
- [ ] #7 Spike: mockup badge placement options before implementing (header, meta, index card)
- [ ] #8 Badge placement decided based on mockup spike
- [ ] #9 Human visual sign-off on badge styling before commit
<!-- AC:END -->
