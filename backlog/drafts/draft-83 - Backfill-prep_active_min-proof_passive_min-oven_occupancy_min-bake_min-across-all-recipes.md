---
id: DRAFT-83
title: >-
  Backfill prep_active_min / proof_passive_min / oven_occupancy_min / bake_min
  across all recipes
status: Draft
assignee: []
created_date: '2026-05-12 13:11'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255.3 spike. Write scripts/backfill-recipe-timing.ts that mirrors the spike classification heuristic (preheat → oven_occupancy; timer:true outside bake → passive_proof; bake stage → oven_occupancy; default → active). Run against all 26 recipes in public/recipes/. Hand-audit the ambiguous cases flagged in pf-255.3-spike-notes.md §6 before commit (ny-pizza COLD_BULK_FERMENT / COLD_PROOF timer mismatch; stretch-fold timer covers rest + ~5 min action; PREP_WORKSPACE 'Preheat & Gather' title false-positive). Adds four optional fields to meta in each recipe. Required before scheduler MVP can read structured timing.
<!-- SECTION:DESCRIPTION:END -->
