---
id: DRAFT-67
title: >-
  Recipe Upgrade Pipeline — structured flow from bake data to recipe version
  bumps
status: Draft
assignee: []
created_date: '2026-05-01 04:08'
labels:
  - feature
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Structured skill/process for graduating bake session learnings into recipe changes. Currently a gap between bake-log (capture) and recipe updates (ad-hoc).

## Problem

Bake-log captures data (notes, experiment tweaks, scratchpad). Recipe updates from that data are ad-hoc — no structured review/decision/bump flow. The /feedback skill handles interactive recipe review but doesn't specifically process accumulated bake data or experiment variations.\n\n## Proposed Flow\n\n1. Review accumulated bake data (cook_log entries, scratchpad, experiment variations)\n2. Surface candidates for recipe graduation (repeated tweaks, consistent notes)\n3. User decides which changes graduate to recipe baseline\n4. Apply changes to recipe JSON\n5. Bump minor version + changelog entry\n6. Commit\n\n## Relationship to Experiment Tool\n\nDRAFT-66 (Experiment Tool) produces codified variation data. This pipeline consumes it. Without this pipeline, experiment data sits in scratchpad/cook_log with no structured path to recipe improvement.\n\n## Open Questions\n- New skill or enhancement to /feedback?\n- How many bakes of consistent data before suggesting graduation?\n- Should this be triggered automatically after N bakes, or always manual?
<!-- SECTION:DESCRIPTION:END -->
