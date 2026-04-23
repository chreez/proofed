---
id: PF-217
title: Relative time inference in bake-log capture
status: Done
assignee: []
created_date: '2026-04-23 18:40'
updated_date: '2026-04-23 18:59'
labels:
  - 'epic:PF-215'
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When user says 'placed in oven 20 minutes ago' at timestamp T, the bake-log agent should create a backdated bake_stats event at T-20min. This is a clear inference from the raw note, not speculation. Add parsing rule to bake-log skill Phase 2b Auto-Parse: detect relative time patterns ('X minutes ago', 'started X ago') and compute absolute timestamps. Mark inferred events with a provenance flag so they're distinguishable from directly logged events.

Skill-only change — no TypeScript or UI modifications needed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 **AC1: Relative time patterns detected** — Phase 2c recognizes patterns: "X minutes ago", "X hours ago", "started X ago", "placed in oven X min ago", "X minutes prior". Patterns are case-insensitive and handle common abbreviations (min, mins, hr, hrs).
- [x] #2 **AC2: Absolute timestamp computed** — When a relative time pattern is found in a scratchpad entry at timestamp T, agent computes T minus the stated offset to produce an absolute timestamp in UTC ISO 8601 format.
- [x] #3 **AC3: Inferred events marked** — Any bake_stats event created via relative time inference gets a `note` annotation indicating provenance (e.g., "inferred: '20 min ago' at 17:21 UTC → start 17:01 UTC"). `BakeStatsBlock.confidence` set to `'medium'` when block contains inferred times.
- [x] #4 **AC4: Echo check shows provenance** — Phase 3 echo displays inferred events with both the raw relative reference and the computed absolute time so user can verify accuracy. Provenance column added to bake_notes table when inferred timestamps present.
- [x] #5 **AC5: Cook Log Protocol enforced** — Only infer from explicitly stated relative times. Never guess unstated durations. "About 20 minutes" is valid (user stated it). "Probably around 20 minutes" requires clarification. Vague references ("a while ago", "a few minutes ago") flagged for user clarification.
- [x] #6 **AC6: Skill.md updated** — New Phase 2c section added to `.claude/skills/bake-log/skill.md` with detection patterns, resolution algorithm, provenance marking, confidence rules, Cook Log Protocol enforcement, echo check display format, and worked examples.
<!-- AC:END -->
