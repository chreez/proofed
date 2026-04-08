---
id: DRAFT-38
title: 'Structured S&F, bake params, aliquot arrays in CookLogEntry'
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
Extend `CookLogEntry` type to support structured arrays for recurring sourdough patterns: stretch-and-fold sequences (fold #, timestamp, dough temp), bake params (preheat/covered/uncovered temps and durations, flips, internal temp out), aliquot tracking (start %, target %, actual %). Fields are optional per entry.

Needs grooming — exact field shapes, nullability, how they integrate with the per-recipe schema from PF-177.1.
<!-- SECTION:DESCRIPTION:END -->
