---
id: PF-96
title: Ensure all recipes have a version field (default v1.0.0)
status: To Do
assignee: []
created_date: '2026-02-10 03:13'
updated_date: '2026-02-10 08:20'
labels: []
dependencies: []
priority: low
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Data hygiene: all recipe JSON files should have a `version` field. If missing, default to v1.0.0. Prevents null edge cases in header display (PF-95) and anywhere else version is rendered.
<!-- SECTION:DESCRIPTION:END -->
