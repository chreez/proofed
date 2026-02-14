---
id: PF-136
title: Cook log summary voice — terse clinical tone + backfill
status: To Do
assignee: []
created_date: '2026-02-14 03:35'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Redefine the AI-generated cook log summary voice. Current summaries are too warm/verbose. Target: brief, clinical, data-forward.

**Flow:**
1. Demo spike: 2-3 voice options applied to existing bake entries side-by-side
2. User picks preferred voice
3. Voice definition codified (lives in /create-recipe as default, used by /feedback)
4. Backfill existing summaries with chosen voice — review process TBD by demo findings

**Related:** PF-119 (photo summary voice demo — same demo pattern), PF-113 (original summary implementation)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Demo shows 2-3 distinct voice options applied to real existing bake summaries
- [ ] #2 Chosen voice definition documented and codified in /create-recipe skill
- [ ] #3 /feedback skill uses the defined voice for new summaries
- [ ] #4 All existing AI-generated summaries backfilled with chosen voice
- [ ] #5 User reviews and approves each backfilled summary before commit
<!-- AC:END -->
