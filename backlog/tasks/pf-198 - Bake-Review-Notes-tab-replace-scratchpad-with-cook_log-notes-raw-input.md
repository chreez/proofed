---
id: PF-198
title: 'Bake Review Notes tab: replace scratchpad with cook_log notes + raw input'
status: To Do
assignee: []
created_date: '2026-04-12 16:29'
labels:
  - ux
dependencies: []
references:
  - src/components/BakeReviewPage.vue
  - src/components/BakeDetailView.vue
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the scratchpad-based Notes tab on BakeReviewPage with cook_log entry data. Two sub-tabs: "Curated" (rendered preview of bake log notes as they'll appear on the final page, plus feedback textarea with copy-to-clipboard) and "Raw Input" (verbatim JSON payload the user pasted).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Notes tab reads cook_log, not scratchpad — sources data from the cook_log entry in recipe JSON (notes, key_notes, raw_notes, summary, next_time), not from localStorage scratchpad
- [ ] #2 Two sub-tabs: "Curated" and "Raw Input" — Notes section contains two switchable sub-tabs with those labels
- [ ] #3 Curated tab renders bake log preview — displays cook_log notes as they would appear on the final bake detail page (summary, key_notes falling back to notes, next_time items) matching BakeDetailView rendering fidelity
- [ ] #4 Curated tab has feedback textarea — below the rendered preview, a textarea labeled "Feedback" for the user to note corrections
- [ ] #5 Feedback copy-to-clipboard — a button adjacent to the feedback textarea copies its contents to clipboard (using shared copyToClipboard utility per F28)
- [ ] #6 Raw Input tab shows verbatim payload — displays raw_notes from cook_log entry in a <pre> block preserving whitespace and timestamps
- [ ] #7 Empty state handling — if cook_log entry has no notes/raw_notes, show appropriate empty state message (not a blank tab)
- [ ] #8 Scratchpad removal from Notes tab — Notes tab no longer references useScratchpad or reads from localStorage
<!-- AC:END -->
