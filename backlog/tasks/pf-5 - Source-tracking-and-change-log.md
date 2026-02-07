---
id: PF-5
title: Source tracking and change log
status: To Do
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-07 00:23'
labels:
  - recipe
  - ungroomed
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add structured source tracking and change log to recipe JSON. Two open questions need a spike:\n\n1. Change log vs version history — are they the same system or separate layers?\n2. Original source data — enrich JSON with structured fields, move full text to JSON, or leave as-is?\n\nSpike should present options with tradeoffs before design/implementation.\n\nCurrently: meta.source is a plain string, original text lives in .claude/rules/validation/original-recipes.md.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Grooming 2026-02-06:** Both key questions answered 'not sure' — needs spike before grooming can complete. Leaving as ungroomed.
<!-- SECTION:NOTES:END -->
