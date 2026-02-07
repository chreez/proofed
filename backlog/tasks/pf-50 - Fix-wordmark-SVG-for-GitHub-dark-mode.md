---
id: PF-50
title: Fix wordmark SVG for GitHub dark mode
status: Done
assignee: []
created_date: '2026-02-07 03:34'
updated_date: '2026-02-07 19:50'
labels:
  - bug (styling)
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The README wordmark (`assets/wordmark.svg`) uses `#1a1816` (near-black ink) for text, which is invisible on GitHub's dark mode background (`#0d1117`). Need to add dark mode support so the wordmark is readable in both light and dark GitHub themes.

Discussed options:
1. CSS `prefers-color-scheme` media query inside the SVG (recommended)
2. Two SVGs with GitHub's `#gh-dark-mode-only` / `#gh-light-mode-only` fragments
3. `currentColor` to inherit GitHub's text color
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Wordmark SVG uses CSS prefers-color-scheme media query to switch text fill for dark mode
- [x] #2 Single SVG file — no duplicate light/dark versions
- [x] #3 Light mode: text remains #1a1816 (ink) on light backgrounds
- [x] #4 Dark mode: text switches to a light color readable on GitHub's dark background (#0d1117)
- [x] #5 Accent dot color (#a65d45) stays the same in both modes
- [x] #6 README renders correctly on GitHub in both light and dark theme
<!-- AC:END -->
