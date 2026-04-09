---
id: PF-195
title: Remove quick rating option from scratchpad note-taking
status: To Do
assignee: []
created_date: '2026-04-09 19:38'
updated_date: '2026-04-09 19:45'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove the quick rating feature (good/ok/bad) from the scratchpad note-taking UI. Will groom later.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Remove standalone quick-rating UI from ScratchpadNote — delete the "Quick rating" section (good/ok/bad buttons) from both mobile and desktop layouts in ScratchpadNote.vue. The addRating emit and currentRating prop are no longer used.
- [ ] #2 Remove rating-type reminder prompts from recipe JSON — delete reminders[] entries with "type": "rating" from: candida-focaccia (×2), grain-free-bread, sourdough-pizza-dough, sourdough-cheddar-bay-biscuits. If a state's reminders array becomes empty after removal, set it to null.
- [ ] #3 Minor version bump per recipe — each of the 5 recipe files touched in AC#2 gets a minor version bump and a change_log entry: "Removed rating-type reminder prompts."
- [ ] #4 Remove addRating and getRatingForStep from useScratchpad — delete the functions, their exports, and corresponding tests. Remove handleAddRating from StateStep.vue and the currentRating computed/prop threading.
- [ ] #5 Existing type: "rating" entries in localStorage are tolerated — the ScratchpadEntry type keeps 'rating' in its union and rating? field. Persisted entries render harmlessly in history (no crash, no blank). No migration needed.
- [ ] #6 Backwards compat verified on dev server — load each of the 5 modified recipes on the dev server. Confirm no render errors, no console errors, existing cook log and scratchpad data intact. Specifically verify against the two in-progress bakes.
- [ ] #7 npm run build passes.
<!-- AC:END -->
