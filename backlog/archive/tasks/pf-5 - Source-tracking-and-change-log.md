---
id: PF-5
title: Source tracking and change log
status: To Do
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-07 01:23'
labels:
  - recipe
  - ungroomed
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Enrich recipe JSON with structured source data. Currently meta.source is a plain string and original recipe text lives in .claude/rules/validation/original-recipes.md.\n\nTarget: structured source object in recipe JSON with URL, attribution, date accessed. Change log already exists as change_log[] array.\n\nOverlaps with PF-11 (suggestion sources) and PF-38 (verifiable citation tracking). Consider merging during implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 meta.source becomes structured object: { name, url, attribution, accessed }
- [ ] #2 Original recipe text referenced or linked (not duplicated in JSON)
- [ ] #3 Existing change_log[] entries unchanged
- [ ] #4 All recipes updated with structured source data
- [ ] #5 Recipe passes /validate after schema change
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Grooming 2026-02-06:** Both key questions answered 'not sure' — needs spike before grooming can complete. Leaving as ungroomed.
<!-- SECTION:NOTES:END -->
