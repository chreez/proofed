---
id: DRAFT-64
title: 'Bake Review Notes tab: replace scratchpad with cook_log notes + raw_notes'
status: Draft
assignee: []
created_date: '2026-04-11 18:38'
labels:
  - bug
  - ux
dependencies: []
references:
  - src/components/BakeReviewPage.vue
  - src/components/BakeDetailView.vue
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Notes tab on BakeReviewPage currently reads scratchpad session storage, which is device-local. In the real workflow, bake notes are captured on iPhone but the review page opens on the MBP — so the tab always shows stale/test data.

Replace with cook_log entry data:
1. **Curated notes** (primary) — agent-organized `notes[]` from the cook_log entry
2. **Collapsible raw notes** — verbatim `raw_notes` paste, same expand/collapse pattern as BakeDetailView
3. **Inline annotation** — ability to flag/callout where the agent's curated notes inferred incorrectly or got something wrong (user correction layer)
<!-- SECTION:DESCRIPTION:END -->
