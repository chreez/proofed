---
id: PF-240
title: Exclude bakes from stats
status: Done
assignee: []
created_date: '2026-05-07 18:26'
updated_date: '2026-05-10 02:36'
labels:
  - feature
  - backlog/drafts
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Some bakes are exploratory variants or atypical sessions that shouldn't count toward lifetime cadence/spend. Add cook_log[].excludeFromStats boolean flag. Bake-stats skill (and any UI surfaces) must filter entries where excludeFromStats is true. Entry still renders normally on recipe page — only stats roll-ups skip it. First example: ba-bolognese 2026-05-07 bake (used 2x tomato paste, custom egg pasta — atypical).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 New optional schema field: cook_log[].excludeFromStats?: boolean (treated as false when absent)
- [x] #2 New optional schema field: recipe.config.excludeFromStatsDefault?: boolean (treated as false when absent)
- [x] #3 src/types/recipe.ts updates CookLogEntry and RecipeConfig interfaces with documentation distinguishing excludeFromStats (omits entry from all stats roll-ups) from aberration (atypical bake; skip hero photo, calories, group counts) — flags are independent
- [x] #4 useBakeAggregates.ts skips entries where excludeFromStats === true from the allDates Set (lifetime cadence dates)
- [x] #5 useBakeAggregates.ts skips entries where excludeFromStats === true from lifetimeSpend (cost.total summation)
- [x] #6 useBakeAggregates.ts skips entries where excludeFromStats === true from groupCounts (typeCounts) and totalBakes
- [x] #7 useBakeAggregates.ts skips entries where excludeFromStats === true from the calories accumulator; existing aberration filter is preserved as a separate filter so both can independently apply
- [x] #8 .claude/skills/bake-stats filters excludeFromStats=true entries from per-recipe and global aggregates; output JSON either omits them from rolled-up counts OR exposes them under a separate 'excluded' field — chosen approach documented in SKILL.md
- [x] #9 /bake-log skill, when creating a new cook_log entry, reads recipe.config.excludeFromStatsDefault: if true, new entry's excludeFromStats defaults to true; if false or absent, defaults to false; user can override per-bake during the skill's confirm/echo step
- [x] #10 Recipe page renders excluded bakes normally (no visual badge); per-bake detail page also renders normally
- [x] #11 Composable test on useBakeAggregates: given two cook_log entries on the same date, one with excludeFromStats=true, daysBaked still includes the date but lifetimeSpend only counts the non-excluded entry's cost
- [x] #12 Composable test: given a single cook_log entry with excludeFromStats=true, daysBaked=0, lifetimeSpend=0, totalBakes=0, totalCalories=0
- [x] #13 Composable test: aberration=true and excludeFromStats=false on the same entry — entry skipped from calories + groupCounts (aberration) but counted in cadence + spend (not stats-excluded); confirms flags are independent
- [x] #14 Composable test: aberration=false and excludeFromStats=true — entry skipped from ALL stats surfaces
- [x] #15 Skill-level test or fixture verifies recipe.config.excludeFromStatsDefault=true causes /bake-log to pre-fill new entry's excludeFromStats=true
- [x] #16 ba-bolognese 2026-05-07 cook_log entry gets excludeFromStats: true set as the first real-world use of the flag (either in this PR or noted as a follow-up data fix in task notes)
- [x] #17 Drift mitigation: this PR enumerates every stats consumer touched in commit message or task notes; deeper centralization tracked under DRAFT-74 spike, NOT in scope here
<!-- AC:END -->
