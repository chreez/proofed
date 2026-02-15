---
id: PF-141
title: Fix broken copy buttons in mise en place (non-secure context)
status: To Do
assignee: []
created_date: '2026-02-15 01:11'
labels:
  - bug
dependencies: []
references:
  - 'src/components/GatherSection.vue:92-99'
  - 'src/components/GatherCategory.vue:107-110'
  - 'src/components/ShareModal.vue:128-149'
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Copy buttons in GatherSection and GatherCategory silently fail on HTTP (LAN IP `192.168.1.213:5173`) because they call `navigator.clipboard.writeText()` directly, which requires a secure context. ShareModal was fixed in PF-140 with an `execCommand('copy')` fallback, but the gather components were missed.

Root cause: no shared clipboard utility — each component has its own clipboard logic, so fixes don't propagate.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Extract a shared `copyToClipboard(text: string)` utility (composable or plain helper) with secure-context check + `execCommand('copy')` fallback
- [ ] #2 Refactor GatherSection.vue `copyGather()` to use the shared utility instead of `navigator.clipboard.writeText()`
- [ ] #3 Refactor GatherCategory.vue `copyCategory()` to use the shared utility instead of `navigator.clipboard.writeText()`
- [ ] #4 Refactor ShareModal.vue `copyLink()` to use the shared utility (remove inline fallback)
- [ ] #5 All three copy buttons work on `http://192.168.1.213:5173` (non-secure HTTP context)
- [ ] #6 All existing tests pass (`npm run build`)
- [ ] #7 Add checklist entry: clipboard calls must use shared `copyToClipboard` utility, not `navigator.clipboard` directly
<!-- AC:END -->
