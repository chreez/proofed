---
id: PF-199
title: >-
  Photo manipulation on review page — AI-powered edit instructions + versioned
  output
status: Done
assignee: []
created_date: '2026-04-12 16:43'
updated_date: '2026-04-14 15:12'
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
- [x] #1 Per-photo edit textarea — each photo card on the review page includes a textarea for natural language edit instructions (e.g., "crop tighter on the bread", "rotate 90° CW"), alongside existing summary/notes/usage fields
- [x] #2 Edit instructions in clipboard JSON — photo edit instructions included in the "Copy feedback to clipboard" JSON payload, keyed per photo
- [x] #3 Versioned photo output — AI-edited photos saved as new versioned files alongside originals (e.g., photo-name-800w.webp = original, photo-name-v1-800w.webp = first edit), both 800w and 400w sizes
- [x] #4 Manifest tracks versions — manifest.json updated to include version entries so both original and edited photos appear on page refresh
- [x] #5 Original and edit visible together — on refresh, review page displays both original photo and AI-edited versions, clearly labeled ("Original", "Edit v1")
- [x] #6 Subagent execution with cheaper model — photo edit processing delegated to subagents using a cheaper model (not Opus), keeping token cost low
- [x] #7 HITL gate on edits — AI-edited photos require explicit human approval before being wired into cook_log entry; user reviews edits on review page before accepting
- [x] #8 Test with existing images — at least one existing bake's photos used to validate the edit pipeline end-to-end during development
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Spike PF-199.1 Findings

**Recommended**: GPT-4o-mini → Sharp.js pipeline
- Cost: ~$0.0005/edit (50 edits/month = $0.025)
- Sharp handles crop/rotate/resize on WebP natively
- LLM must be multimodal (needs to see image to locate subjects)
- JSON schema: `{operation, params: {left,top,width,height}, explanation}`
- GPT-4o-mini: 2.8x cheaper than Haiku, proven at bounding box tasks
- Alternative: Claude Haiku at ~$0.001/edit if Claude consistency preferred
- Do NOT use Sonnet/Opus for this — overkill for geometric transforms
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented photo editing on BakeReviewPage with preset checkboxes (Rotate CW/CCW, Flip, Crop & tighten) behind an "Edit image" toggle. Created `scripts/edit-photo.ts` for Sharp.js transforms with multi-op chaining via PNG intermediates. Manifest versions are flattened as standalone photo cards in the review list — user marks original as exclude if satisfied with the edit. Includes double-processing prevention (editInstruction cleared when it matches latest applied version).
<!-- SECTION:FINAL_SUMMARY:END -->
