---
id: PF-49
title: 'Bug: Remove "packed" from brown sugar label'
status: Done
assignee: []
created_date: '2026-02-07 03:08'
updated_date: '2026-02-07 03:10'
labels:
  - bug
  - recipe
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Brown sugar shows as "Light Brown Sugar (packed)" with a technique glossary tooltip explaining how to pack brown sugar into a measuring cup. This is irrelevant — proofed. uses grams, not volumetric measures. "Packed" was from the original ATK recipe which used cups.\n\nFix: remove "(packed)" from the ingredient name in the recipe JSON. May also need to remove the "packed" technique from the glossary if nothing else references it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Brown sugar ingredient name does not include 'packed' or '(packed)'
- [ ] #2 Technique glossary tooltip for 'packed' removed or unreferenced
- [ ] #3 Recipe JSON passes /validate after change
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed \"(packed)\" from brown sugar names in all 3 recipe variants (quick, ultimate, overnight). Deleted orphaned \"packed\" technique glossary entry. Term was a volumetric leftover from the original ATK recipe — irrelevant with gram-based weights.
<!-- SECTION:FINAL_SUMMARY:END -->
