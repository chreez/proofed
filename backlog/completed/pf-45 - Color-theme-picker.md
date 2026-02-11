---
id: PF-45
title: Color theme picker
status: Done
assignee: []
created_date: '2026-02-07 02:50'
updated_date: '2026-02-07 03:19'
labels:
  - feature
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Color theme picker with dark mode + 1-2 alternate palettes. Accent color (#a65d45 terracotta) stays fixed across all themes as brand identity.\n\nNeeds spike on UnoCSS dynamic theming approach — CSS custom properties vs multiple theme configs vs class-based switching.\n\nThemes: default stone (current), dark, and 1-2 alternates (cooler blue-grey or warmer variant TBD).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spike: research UnoCSS theming (CSS custom properties, class-based switching, or multiple configs)
- [ ] #2 Spike: document chosen approach with tradeoffs
- [ ] #3 Default stone palette unchanged as baseline theme
- [ ] #4 Dark mode theme: inverted backgrounds/text, accent stays #a65d45
- [ ] #5 1-2 alternate palette themes (specific palettes TBD after spike)
- [ ] #6 Accent color (#a65d45) fixed across all themes — brand identity
- [ ] #7 Theme toggle UI: location TBD (header, footer, or settings)
- [ ] #8 Theme preference persisted in localStorage
- [ ] #9 All components render correctly in every theme (no hardcoded colors)
- [ ] #10 Human visual sign-off on each theme before commit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Migrated all hardcoded color values to CSS custom properties (design tokens) in `:root`. UnoCSS theme now references CSS vars instead of hex literals. Replaced broken opacity modifiers (`bg-accent/10`, `bg-warning/10`) with pre-computed tint vars. Replaced `bg-white` → `bg-surface`, `text-white` → `text-stone-50` on dark backgrounds. Theme switching UI was explored but rolled back — only the infrastructure improvements were kept.
<!-- SECTION:FINAL_SUMMARY:END -->
