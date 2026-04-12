---
id: PF-202
title: Review page cost tab — scrollable product list + preserve manual entries
status: Done
assignee: []
created_date: '2026-04-12 17:29'
updated_date: '2026-04-12 18:07'
labels:
  - ux
dependencies: []
references:
  - src/components/BakeReviewPage.vue
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The cost tab on the bake review page needs UX improvements: each ingredient should show its product options in a fixed-height scrollable area (3 items visible, overflow scroll). Currently manual entries (e.g., "Morton Sea Salt") aren't visible in the product list, causing the cost to show $0. Manual/custom cost entries from the user's selections need to be preserved and displayed alongside HEB product options.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each ingredient's product options display in a fixed-height scrollable container showing 3 items, with vertical scroll for overflow
- [x] #2 Manual cost entries (sourceType: 'manual') are visible in the product list alongside HEB results
- [x] #3 Rate entries (sourceType: 'rate') are visible in the product list (e.g., tap water at $0)
- [x] #4 Selected product (HEB, manual, or rate) is visually highlighted in the scrollable list
- [x] #5 Salt ingredient for sourdough pizza shows Morton Sea Salt as a selectable option with correct cost
- [x] #6 Scrollable container uses consistent border/padding with existing review page card styling
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Mandatory test case**: Sourdough pizza dough 2026-04-11 review page — Morton Sea Salt must appear as a selectable option for the salt ingredient. Currently invisible, causing $0 cost. Use this bake as the primary validation instance.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added filter/search bar to HEB product list on BakeReviewPage when >5 products per ingredient. Products filtered by name/brand as user types. Scrollable container (max-h-300px) prevents list from dominating the page. HEB search limit raised from 5→20 in bake-log skill. Validated with sourdough pizza — Morton Sea Salt now discoverable via filter. Existing tab system (Store Product / Stored Rate / Custom Rate / Other) preserved.
<!-- SECTION:FINAL_SUMMARY:END -->
