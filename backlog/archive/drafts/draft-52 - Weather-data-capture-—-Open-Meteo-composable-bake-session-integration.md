---
id: DRAFT-52
title: Weather data capture — Open-Meteo composable + bake session integration
status: Draft
assignee: []
created_date: '2026-04-09 17:50'
labels:
  - data
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement weather data capture for bake log entries using the Open-Meteo API, as researched in PF-185 spike.

## Spike Findings
Architecture decision and API evaluation documented in `backlog/tasks/pf-185-spike-notes.md`. Key decisions:
- Open-Meteo free tier, no API key required
- Historical weather endpoint for retroactive lookups
- Composable-based architecture (`useWeather`)

## Demo
Architecture flow demo at `public/demo/weather-flow.html` — clean up demo file when implementation ships.

## Pairing
This pairs with PF-186 (ambient temp capture) for a combined weather + ambient capture at bake start. Consider implementing together for a unified "bake environment" snapshot.
<!-- SECTION:DESCRIPTION:END -->
