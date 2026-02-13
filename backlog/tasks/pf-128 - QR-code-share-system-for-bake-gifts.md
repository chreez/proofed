---
id: PF-128
title: QR code share system for bake gifts
status: To Do
assignee: []
created_date: '2026-02-13 01:46'
updated_date: '2026-02-13 05:15'
labels: []
dependencies:
  - PF-130
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Generate a QR code permalink for each recipe that can be printed on a label maker and stuck on the food/container. Links directly to cooking instructions. Also includes a splash page — who I am and what I'm doing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe JSON schema includes a `reheat` object at root level with structured reheat instructions; changes to reheat data trigger a minor version bump in `change_log`
- [ ] #2 Recipe header displays a "Share" / QR icon button (consistent with existing `IconButton` pattern)
- [ ] #3 Tapping the QR button opens a bake picker showing all cook log entries for that recipe (date + summary), user selects which bake to share
- [ ] #4 After selecting a bake, a QR code is generated client-side encoding the URL `proofeddot.netlify.app/recipe/:recipeId?shared=true&bake=YYYY-MM-DD`
- [ ] #5 The generated QR code is displayed as a saveable image (long-press save on mobile / right-click save on desktop)
- [ ] #6 When the recipe page loads with `?shared=true&bake=DATE` params, a welcome popover renders on top of the recipe page
- [ ] #7 The popover displays: (a) personal intro ("Hey, I'm Chris" + brief context), (b) photos from the specified cook log entry, (c) reheat instructions from the recipe's `reheat` field
- [ ] #8 If no human-written reheat instructions exist for a recipe, the popover displays an agent-generated summary based on recipe data (clearly marked as auto-generated)
- [ ] #9 Dismissing the popover reveals the full recipe page underneath (normal recipe view, no disruption)
- [ ] #10 QR codes use `proofeddot.netlify.app` as the base URL
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## QR Library Decision\n\n`qr-code-styling` (MIT, ~50KB) — user-tested on iPhone, chosen for brand-matchable styling (rounded dots, accent corners). See PF-128.1 spike notes for full evaluation."
<!-- SECTION:NOTES:END -->
