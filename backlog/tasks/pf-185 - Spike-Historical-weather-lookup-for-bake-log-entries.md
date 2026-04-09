---
id: PF-185
title: 'Spike: Historical weather lookup for bake log entries'
status: To Do
assignee: []
created_date: '2026-04-09 15:32'
labels:
  - spike
  - data
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Research how to look up historical outdoor weather conditions (temperature, humidity, rain/clear/cloudy) by location and date for bake log entries.

## Goal
Enable weather data capture for both backfill (past bakes) and future bake sessions. The weather indicator would show in bake log views — an icon for conditions (rainy/clear/cloudy) plus outdoor humidity.

## Key questions for the spike
1. What APIs/MCP tools can provide historical weather by zip code + date?
2. Open-Meteo vs other free options — accuracy, rate limits, historical depth
3. Speed: can we look up weather inline during a bake-log session or does it need batching?
4. Accuracy validation: spot-check some known bake dates + use today's date as a true check
5. Should this be an MCP server (so agents call it during bake-log) or a simpler script/composable?

## Location strategy
- Default to fixed home location: 78727 Austin, TX
- Allow per-bake location override (for travel bakes)

## Data strategy
- Every timestamped cook_log entry is a potential weather data point
- Batch-fetch hourly weather for all timestamps in a bake session
- Store raw hourly readings — compute aggregates from them (active bake window avg, full day avg, multi-day bake avg)
- Capture as much as possible now for future stat flexibility — never know what we'll need

## Context
- This is NOT indoor ambient temp (separate concern)
- Provenance UX (marking data as "backfilled from API" vs "recorded live") is a separate task
- "Full bake metadata stats" expandable display feature is a separate task
- Outdoor weather affects fermentation behavior, especially for long bulk ferments
- User wants to see at a glance if a bake day was hot/humid/rainy
- Feeds into a visual weather indicator on bake log table/page/condensed views
- Icon treatment needs to be non-distracting — existing UI already has some clutter
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Evaluate ≥2 free weather APIs for historical hourly data by zip/coords + date
- [ ] #2 Document rate limits, historical depth, and accuracy for each option
- [ ] #3 Spot-check ≥3 known bake dates against a reliable source (e.g., Weather Underground) for accuracy validation
- [ ] #4 Recommend architecture (MCP server / script / composable) with rationale
- [ ] #5 Propose a `weather` data schema that stores raw hourly readings for flexible aggregation
- [ ] #6 Confirm batch lookup is feasible (all timestamps per bake in ≤1 API call or minimal calls)
- [ ] #7 Demo subtask: mock up 2-3 non-distracting weather icon treatments in bake log UI context
- [ ] #8 Document findings in spike notes on the parent task
<!-- AC:END -->
