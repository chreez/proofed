---
id: PF-93
title: Unit system — grams truth + optional alternative measurements
status: To Do
assignee: []
created_date: '2026-02-10 02:17'
updated_date: '2026-02-10 08:20'
labels:
  - ungroomed
  - epic
dependencies: []
priority: medium
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dual-unit system where grams are the non-nullable source of truth and ingredients can optionally carry alternative measurements (volumetric/imperial). Schema migration from flat gram amounts to a structured units model with validation enforcing grams always present. Existing grams-only recipes must work unchanged, display degrades gracefully when no alternatives exist.

Use case: Making recipes accessible to people who don't use scales (e.g., Gemma's recipes) while preserving precision for baking-critical measurements.

Note to users: Not all recipes will have alternative measurement systems.
<!-- SECTION:DESCRIPTION:END -->
