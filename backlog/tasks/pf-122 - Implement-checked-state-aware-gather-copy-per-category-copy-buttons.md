---
id: PF-122
title: Implement checked-state-aware gather copy + per-category copy buttons
status: Done
assignee: []
created_date: '2026-02-11 21:46'
updated_date: '2026-02-11 21:51'
labels:
  - ux
  - feature
dependencies:
  - PF-94
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement Approach A from PF-94 spike. Enhance the existing per-stage "Copy Mise en Place" button to filter out checked items, and add per-category copy buttons for grocery-friendly ingredient lists.

Spike reference: PF-94 implementation notes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Main "Copy Mise en Place" button in GatherSection.vue copies only unchecked items (vessels + equipment + ingredients). If all items are checked, shows "Everything gathered!" feedback instead of copying.
- [x] #2 Per-category copy button (small clipboard icon) appears next to each GatherCategory header (Vessels, Equipment, Ingredients). Only visible when that category has unchecked items.
- [x] #3 Per-category copy format is clean — no section headers, no bullets. Ingredients: `Name — Totalunit` per line. Vessels/Equipment: plain name per line.
- [x] #4 Main copy button retains section headers (Vessels/Equipment/Ingredients) but only includes unchecked items in each section. Empty sections are omitted.
- [x] #5 Copy buttons use existing IconButton.flashCopied() pattern for visual feedback.
- [x] #6 Progress reset (all unchecked) reverts to copying everything — same as current behavior.
- [x] #7 Existing snapshot tests updated. New unit tests for filtered copy logic (unchecked-only, all-checked edge case, mixed state).
- [x] #8 npm run build passes.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete. Modified 4 files:
- GatherSection.vue: `formatGatherForCopy()` filters by checked state, `allItemsChecked` computed for "Everything gathered!" feedback
- GatherCategory.vue: per-category clipboard icon button, `copyCategory()` with clean format
- GatherSection.spec.ts: 3 new tests (unchecked-only, empty section omission, all-checked feedback)
- GatherCategory.spec.ts: 4 new tests (button visibility, format, edge cases)

575 tests passing, 100% diff coverage on changed files. Visual HITL approved.
<!-- SECTION:NOTES:END -->
