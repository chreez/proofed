---
id: PF-102
title: 'Rework status pipeline: add Draft status, backfill ungroomed tasks'
status: Done
assignee: []
created_date: '2026-02-10 04:58'
updated_date: '2026-02-10 08:29'
labels:
  - dx
  - infra
dependencies: []
priority: medium
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hybrid Draft pipeline: new ideas enter as DRAFT-X in backlog/drafts/, get promoted to PF-X when groomed. Existing ungroomed PF- tasks stay in place — strip the ungroomed label as they get groomed naturally. Phase out ungroomed label over time.\n\nBacklog.md treats Draft as a separate namespace (backlog/drafts/ with DRAFT- IDs), not a linear pipeline status. Tasks set to Draft lose their PF- ID. This hybrid approach avoids breaking existing task references.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 config.yml: add Draft to statuses array (before To Do)
- [x] #2 grooming.md: new ideas use `backlog draft create` → promote to PF- on groom completion
- [x] #3 CLAUDE.md: update ungroomed label references → Draft status for new ideas, existing ungroomed tasks groomed in place
- [x] #4 Skills (/validate, /research): update any ungroomed label references
- [x] #5 Existing ungroomed tasks: NO migration — groom in place, strip label when groomed
- [x] #6 Remove ungroomed from labels config if present (no new tasks should use it)
- [x] #7 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Spike findings (2026-02-10):\n- Backlog.md Draft is a separate namespace: tasks live in backlog/drafts/ with DRAFT-X IDs\n- Setting a PF- task to Draft status MOVES it and reassigns ID (PF-109 → DRAFT-1)\n- Promotion moves DRAFT-X → PF-X (new ID assigned)\n- Cannot use Draft as a simple pipeline status without losing PF- IDs\n- Hybrid chosen: new ideas → drafts, existing ungroomed tasks stay as PF- and groom in place
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Draft as first-class status in Backlog.md config. New ideas enter as DRAFT-X in backlog/drafts/, promoted to PF-X when groomed. Existing ungroomed PF- tasks stay in place with their IDs — strip label when groomed organically.\n\nFiles changed:\n- `backlog/config.yml` — added Draft to statuses array\n- `.claude/rules/grooming.md` — step 4 updated for Draft promotion + legacy ungroomed handling\n- `CLAUDE.md` — Grooming Rules section rewritten for Draft workflow\n- `memory/MEMORY.md` — added Draft status decision\n\nNo migration of existing tasks. Skills (/validate, /research) had no ungroomed references. ungroomed was not in labels config.
<!-- SECTION:FINAL_SUMMARY:END -->
