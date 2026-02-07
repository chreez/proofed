---
id: PF-28
title: Allergy and dietary restriction indicators on recipes
status: To Do
assignee: []
created_date: '2026-02-06 20:25'
updated_date: '2026-02-07 01:23'
labels:
  - feature
  - ungroomed
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
- [ ] #2 Allergen badges render on recipe header
- [ ] #3 Allergen badges render on index page recipe cards
- [ ] #4 Uses FDA Big 9 as baseline allergen categories
- [ ] #5 Manual tagging only — no auto-detection from ingredient names
- [ ] #6 Missing allergen data shows nothing (not 'unknown')
- [ ] #7 Human visual sign-off on badge styling before commit
<!-- AC:END -->
