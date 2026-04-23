---
id: DRAFT-72
title: Backfill proof_phases for existing sourdough bakes
status: Draft
assignee: []
created_date: '2026-04-23 18:40'
labels:
  - 'epic:DRAFT-69'
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
6 sourdough bakes have shape_time + bake_phases but no proof_phases. Can derive cold_retard duration from the gap between shape_time and first bake_phases start_time. Some bakes also have notes mentioning bench rest duration. Each backfilled entry needs a confidence rating (high/medium/low) based on: timestamps available, supporting evidence in notes, whether times are exact or estimated. 3 earliest bakes (Feb 14, 16, 17) pre-date structured stats — may not be backfillable.

Pure data task — manual JSON edits to simple-sourdough.json, no code changes.
<!-- SECTION:DESCRIPTION:END -->

## Per-Bake Analysis

| Date | Shape Time | Bake Start | Gap | Notes Evidence | Confidence |
|------|-----------|------------|-----|----------------|------------|
| Feb 20 | Feb 19 20:30 | Feb 20 13:00 | ~16.5hr | "cold proofed ~16 hours (9:15pm to ~1pm)" — fridge at 21:15 | Medium |
| Feb 27 | Feb 26 20:30 | Feb 27 08:45 | ~12.25hr | "Final shaped at 20:35, into fridge at 21:40. ~11 hours" | High |
| Mar 18 | 03:51 | 09:45 | ~5.9hr | "bench rest ~25 min, room temp ~1 hour, cold retard overnight" | High |
| Apr 1 | 01:01 | 11:58 | ~11hr | "~8 hours (~3am to ~11am)" | Medium |
| Apr 9 | 15:38 | 09:59 (+1d) | ~18.35hr | User calculated "17h 50m total proof" in notes | High |
| Apr 12 | 21:33 | 15:38 (+1d) | ~18.1hr | "Stitch-shaped 10:43pm, room temp rest, into fridge" — fridge time unclear | Medium |

## Acceptance Criteria

- [ ] **AC1: proof_phases added to 6 bakes** — Feb 20, Feb 27, Mar 18, Apr 1, Apr 9, Apr 12 each get `proof_phases[]` in their `bake_stats` block, using Apr 14/15 entries as structural template.
- [ ] **AC2: Each entry has bench_rest and cold_retard** — Where notes support both phases, include both as separate ProofPhase entries. Where only cold_retard is derivable, include just that one.
- [ ] **AC3: Confidence rated per bake** — Each backfilled bake's `bake_stats.confidence` reflects the quality of proof timing data: High (explicit timestamps in notes match calculated gap), Medium (some times inferred or notes conflict slightly with calculated gap).
- [ ] **AC4: Notes-sourced times annotated** — ProofPhase `note` field documents evidence source (e.g., "Derived from notes: 'into fridge at 21:40'"). Estimates prefixed with "~".
- [ ] **AC5: No code changes** — Pure JSON data edits to `public/recipes/simple-sourdough.json`. Existing ProofPhase type and BakeStatsBlock renderer already handle the data.
- [ ] **AC6: Build passes** — `npm run build` exits 0 after edits.
