---
id: PF-198
title: 'Bake Review Notes tab: replace scratchpad with cook_log notes + raw input'
status: Done
assignee: []
created_date: '2026-04-12 16:29'
updated_date: '2026-04-12 17:32'
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
- [x] #1 Notes tab reads cook_log, not scratchpad — sources data from the cook_log entry in recipe JSON (notes, key_notes, raw_notes, summary, next_time), not from localStorage scratchpad
- [x] #2 Two sub-tabs: "Curated" and "Raw Input" — Notes section contains two switchable sub-tabs with those labels
- [x] #3 Curated tab renders bake log preview — displays cook_log notes as they would appear on the final bake detail page (summary, key_notes falling back to notes, next_time items) matching BakeDetailView rendering fidelity
- [x] #4 Curated tab has feedback textarea — below the rendered preview, a textarea labeled "Feedback" for the user to note corrections
- [x] #5 Feedback copy-to-clipboard — a button adjacent to the feedback textarea copies its contents to clipboard (using shared copyToClipboard utility per F28)
- [x] #6 Raw Input tab shows verbatim payload — displays raw_notes from cook_log entry in a <pre> block preserving whitespace and timestamps
- [x] #7 Empty state handling — if cook_log entry has no notes/raw_notes, show appropriate empty state message (not a blank tab)
- [x] #8 Scratchpad removal from Notes tab — Notes tab no longer references useScratchpad or reads from localStorage
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced scratchpad-based Notes tab with cook_log-sourced data. Two sub-tabs: Curated (summary, key_notes, next_time, feedback textarea) and Raw Input (verbatim raw_notes in pre block). Feedback textarea content flows into main Copy review data clipboard payload as notesFeedback field. Removed standalone copy feedback button. Scratchpad import removed from Notes tab. 96 tests passing with diff-coverage met.
<!-- SECTION:FINAL_SUMMARY:END -->
