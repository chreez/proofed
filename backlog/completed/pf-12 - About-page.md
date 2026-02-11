---
id: PF-12
title: About page
status: Done
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-07 00:44'
labels:
  - feature
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dedicated /about route. Content: author (Chris Palmer), GitHub repo link, Instagram (rhythm_hawk), site description ('proofed. — A personal cooking notebook. Recipes as structured data.')\n\nKeep it simple and on-brand. Monospace + warm stone palette. Footer links to this page.\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Accessible at /about route
- [x] #2 Shows author name, GitHub link, Instagram link
- [x] #3 Shows site description/tagline
- [x] #4 On-brand styling (monospace headings, stone palette)
- [x] #5 Footer links to /about
- [x] #6 Human visual sign-off on dev server before commit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added /about route and AboutPage component.\n- Three-paragraph intro: pitch, problem (scattered recipe formats), solution (structured JSON)\n- \"What it facilitates\" section with // comment-style bullets: repeatable bakes, learning over time, recipe versioning, mise en place checklists, nutritional transparency\n- proofed. styled with font-mono + accent dot throughout\n- Links removed from about page (live in footer only)\n- Footer updated: \"About\" RouterLink added, link colors fixed from browser-blue to text-stone-400\n- \"Built by Chris Palmer\" attribution at bottom\n- Router: added /about route
<!-- SECTION:FINAL_SUMMARY:END -->
