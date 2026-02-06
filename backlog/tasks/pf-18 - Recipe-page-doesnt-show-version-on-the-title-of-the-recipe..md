---
id: PF-18
title: Recipe page doesn't show version on the title of the recipe.
status: To Do
assignee: []
created_date: '2026-02-06 18:52'
updated_date: '2026-02-06 19:48'
labels:
  - bug
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Show the recipe version below the recipe name as a subtitle line. Monospace, muted styling (font-mono text-stone-400). Format: v{major}.{minor} (drop patch). Example: 'v1.1' below 'ATK Ultimate Cinnamon Buns'.\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Version displays below recipe name as subtitle
- [ ] #2 Uses font-mono text-stone-400 styling
- [ ] #3 Format is v{major}.{minor} (no patch)
- [ ] #4 Version does NOT appear if recipe has no version field
- [ ] #5 Human visual sign-off on dev server before commit
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**2026-02-06 — Reverted.** Previous attempt was part of the PF-17 batch that got reverted. No clarification questions were asked (violated AC #1).

Changes were reverted by user/linter. Needs re-implementation with user sign-off.
<!-- SECTION:NOTES:END -->
