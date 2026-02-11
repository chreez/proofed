---
id: PF-31
title: Add site footer
status: Done
assignee: []
created_date: '2026-02-07 00:26'
updated_date: '2026-02-07 00:34'
labels:
  - feature
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Minimal global footer on every page. Content: 'proofed. \u00a9 2026 Chris Palmer' + GitHub icon/link + Instagram icon/link. On-brand: stone palette, monospace for brand name.\n\nShould not compete with recipe content — subtle, small.\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Footer renders on every page/route
- [x] #2 Shows 'proofed. © 2026 Chris Palmer'
- [x] #3 GitHub and Instagram links present
- [x] #4 On-brand minimal styling
- [x] #5 Does not interfere with recipe page scroll/layout
- [x] #6 Human visual sign-off on dev server before commit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added minimal site footer rendered on every page.\n- SiteFooter.vue: copyright line (proofed. © 2026 Chris Palmer) + GitHub/Instagram icon links\n- Mobile: stacked vertically and centered to avoid FAB overlap\n- Desktop: horizontal with justify-between\n- GitHub: https://github.com/chreez/proofed, Instagram: rhythm_hawk\n- On-brand: stone-400 text, monospace brand name, accent dot, border-t-2
<!-- SECTION:FINAL_SUMMARY:END -->
