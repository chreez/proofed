---
id: PF-105
title: 'Fix README: add live site link, fix SVG visibility'
status: To Do
assignee: []
created_date: '2026-02-10 05:11'
updated_date: '2026-04-10 14:18'
labels:
  - bug
  - dx
dependencies: []
priority: low
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
README.md is missing a link to the live Netlify-hosted site. The wordmark SVG at `assets/wordmark.svg` is also not rendering visibly on GitHub. May need raw URL, PNG fallback, or SVG content inline. Current README references `assets/wordmark.svg` but it doesn't display.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 README contains live site link (https://proofeddot.netlify.app)
- [ ] #2 SVG visibility deferred — user will verify manually after other work
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation\n- Added centered live site link `https://proofeddot.netlify.app` to README.md (lines 5-7)\n- Placed below wordmark SVG, matching centered alignment\n- SVG visibility deferred — user will verify on GitHub

2026-04-10: Demoted from In Progress → To Do during stale task triage. Stale 7 weeks. Minor housekeeping — live link already added per implementation notes, SVG visibility deferred.
<!-- SECTION:NOTES:END -->
