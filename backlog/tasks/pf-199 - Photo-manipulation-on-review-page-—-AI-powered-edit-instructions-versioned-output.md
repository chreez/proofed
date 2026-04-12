---
id: PF-199
title: >-
  Photo manipulation on review page — AI-powered edit instructions + versioned
  output
status: To Do
assignee: []
created_date: '2026-04-12 16:43'
labels:
  - ux
dependencies: []
references:
  - src/components/BakeReviewPage.vue
  - scripts/process-photos.ts
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add per-photo natural language edit instructions to the bake review page. Edit instructions are captured in the existing clipboard JSON workflow and processed by subagents using a cheaper model. AI-edited photos are saved as versioned files alongside originals, both visible on the review page for comparison. Requires HITL approval before edits are wired into cook_log.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Per-photo edit textarea — each photo card on the review page includes a textarea for natural language edit instructions (e.g., "crop tighter on the bread", "rotate 90° CW"), alongside existing summary/notes/usage fields
- [ ] #2 Edit instructions in clipboard JSON — photo edit instructions included in the "Copy feedback to clipboard" JSON payload, keyed per photo
- [ ] #3 Versioned photo output — AI-edited photos saved as new versioned files alongside originals (e.g., photo-name-800w.webp = original, photo-name-v1-800w.webp = first edit), both 800w and 400w sizes
- [ ] #4 Manifest tracks versions — manifest.json updated to include version entries so both original and edited photos appear on page refresh
- [ ] #5 Original and edit visible together — on refresh, review page displays both original photo and AI-edited versions, clearly labeled ("Original", "Edit v1")
- [ ] #6 Subagent execution with cheaper model — photo edit processing delegated to subagents using a cheaper model (not Opus), keeping token cost low
- [ ] #7 HITL gate on edits — AI-edited photos require explicit human approval before being wired into cook_log entry; user reviews edits on review page before accepting
- [ ] #8 Test with existing images — at least one existing bake's photos used to validate the edit pipeline end-to-end during development
<!-- AC:END -->
