---
id: PF-4.2
title: 'Design: Photo pipeline architecture'
status: In Progress
assignee: []
created_date: '2026-02-07 04:36'
updated_date: '2026-02-07 04:36'
labels:
  - design
dependencies:
  - PF-4.1
parent_task_id: PF-4
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
High-level design doc for the photo pipeline. Covers directory structure, script CLI interface, recipe JSON schema changes, TypeScript types, .gitignore updates, Vue component approach, and npm script wiring. Based on PF-4.1 spike findings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Directory structure documented (photos-source/ input, public/images/ output)
- [ ] #2 Script CLI interface defined (args, flags, dry-run, --all)
- [ ] #3 CookLogEntry.photos schema defined (src, alt, caption fields)
- [ ] #4 TypeScript interface additions specified
- [ ] #5 .gitignore additions specified (photos-source/, *.HEIC, *.heic)
- [ ] #6 Vue rendering approach decided (inline in CookLogSection vs separate component)
- [ ] #7 npm script entry defined
<!-- AC:END -->
