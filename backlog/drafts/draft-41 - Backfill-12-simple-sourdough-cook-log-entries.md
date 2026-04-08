---
id: DRAFT-41
title: Backfill 12 simple-sourdough cook log entries
status: Draft
assignee: []
created_date: '2026-04-08 17:04'
labels:
  - ungroomed
dependencies:
  - PF-177
parent_task_id: PF-177
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migrate all 12 existing `simple-sourdough` cook log entries from prose into the new structured format. Timing, temps, and aliquot data currently embedded in `notes[]` prose (e.g. "5:07pm — fold 1, 75.5°F", "60% rise") gets pulled into the structured S&F / bake params / aliquot fields. `notes[]` arrays are left with only observations and judgment after backfill.

Needs grooming — mapping from prose to structured fields, handling of entries with missing data (early bakes didn't track aliquot).

Blocks: no other recipe backfill drafts should be spun out until sourdough backfill lands as the exemplar.
<!-- SECTION:DESCRIPTION:END -->
