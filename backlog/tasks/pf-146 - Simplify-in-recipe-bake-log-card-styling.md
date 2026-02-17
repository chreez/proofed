---
id: PF-146
title: Simplify in-recipe bake log card styling
status: To Do
assignee: []
created_date: '2026-02-17 04:35'
updated_date: '2026-02-17 04:44'
labels:
  - ux
  - bug (styling)
dependencies: []
references:
  - ~/Desktop/Screenshot 2026-02-16 at 10.33.43 PM.png
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Current CookLogSection card styling feels overworked. User wants to simplify the in-recipe bake log presentation. Reference screenshot shows the collapsed photo banner card treatment that needs rethinking.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Collapsed cards use a single consistent layout for both photo and no-photo entries (no gradient overlay, no text-on-image)
- [ ] #2 Date, version badge, and metadata (note count, photo count, cost) are always readable — no overlap or clipping
- [ ] #3 If photos exist, hero thumbnail is shown as a small fixed-size preview (not a full-width banner)
- [ ] #4 Expand/collapse interaction preserved (click toggles, chevron indicator, hash-link auto-expand)
- [ ] #5 Expanded state unchanged (border-left warning style, full notes + photos)
- [ ] #6 Cost one-liner renders correctly in simplified collapsed layout
- [ ] #7 Snapshot test updated to match new collapsed markup
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Additional detail: title text overlaps/covers content in the collapsed cook log card on the recipe page. Visible on simple-sourdough #cook-log-section with the 2026-02-16 entry.
<!-- SECTION:NOTES:END -->
