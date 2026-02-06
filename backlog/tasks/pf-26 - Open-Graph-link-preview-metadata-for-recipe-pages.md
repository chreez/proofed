---
id: PF-26
title: Open Graph / link preview metadata for recipe pages
status: To Do
assignee: []
created_date: '2026-02-06 20:13'
updated_date: '2026-02-06 20:25'
labels:
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add Open Graph and Twitter Card meta tags so recipe links show rich previews in iMessage, Discord, Slack, etc.\n\nIndex page: brand tagline — 'proofed. — A personal cooking notebook. Recipes as structured data.'\n\nRecipe pages: use meta.description if available in JSON, fall back to template: 'A proofed. recipe: {name} — {yields}, {active_time} active'\n\nog:image: research options (brand logo card, text card with recipe name, skip until PF-4). Present options to user.\n\nNeeds to work with Vue Router SPA — may need prerendering or meta tag injection at build time.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Index page has og:title, og:description, og:image meta tags
- [ ] #2 Recipe pages have per-recipe og:title, og:description
- [ ] #3 Description falls back to template if meta.description missing from JSON
- [ ] #4 Twitter Card tags present (twitter:card, twitter:title, etc.)
- [ ] #5 Previews render correctly in iMessage link unfurl
- [ ] #6 og:image strategy decided via user review of options
- [ ] #7 Works with Vue Router SPA (build-time or prerender solution)
<!-- AC:END -->
