---
id: PF-102
title: 'Rework status pipeline: add Draft status, backfill ungroomed tasks'
status: To Do
assignee: []
created_date: '2026-02-10 04:58'
updated_date: '2026-02-10 05:51'
labels:
  - dx
  - infra
  - auto-groomed
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Clean up the status pipeline by adding Draft as a real status instead of using the `ungroomed` label as a pseudo-status. Draft = idea captured, not groomed, not ready. To Do = groomed, ACs written, ready to pick up.\n\nChanges:\n1. Add `Draft` to `config.yml` statuses array (before To Do)\n2. Backfill all tasks with `ungroomed` label → status Draft, remove the label\n3. Update `grooming.md`: grooming completion = Draft → To Do (not \"remove ungroomed label\")\n4. Update `CLAUDE.md`: references to `ungroomed` label → Draft status\n5. Update skills (`/validate`, `/research`) if they reference the old vernacular
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `config.yml` statuses updated to `["Draft", "To Do", "In Progress", "Done"]`
- [ ] #2 All tasks currently labeled `ungroomed` are moved to status `Draft` and label removed
- [ ] #3 Done tasks with `ungroomed` label: keep Done status, strip label only
- [ ] #4 `ungroomed` removed from any label lists/config if present
- [ ] #5 `grooming.md`: "remove `ungroomed` label" → "move from Draft → To Do"
- [ ] #6 `CLAUDE.md`: all references to `ungroomed` label updated to Draft status
- [ ] #7 Skills (`/validate`, `/research`) updated if they reference `ungroomed`
- [ ] #8 `npm run build` passes after all changes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Auto-groomed. Clarifying questions answered from prior conversation context and inference. Assumption flagged: `ungroomed` label should be fully removed from config (not kept alongside Draft). Scope limited to Draft only — no Scheduled/Deferred statuses in this task.

User note: implement on a separate branch (not mainline). Wait until current in-progress work is done before starting.
<!-- SECTION:NOTES:END -->
