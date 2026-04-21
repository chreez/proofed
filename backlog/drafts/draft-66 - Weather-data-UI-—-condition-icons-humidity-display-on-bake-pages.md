---
id: DRAFT-66
title: Weather data UI — condition icons + humidity display on bake pages
status: Draft
assignee: []
created_date: '2026-04-21 14:24'
labels:
  - feature
  - ux
dependencies:
  - PF-193
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Render `CookLogEntry.weather` (BakeWeather type) visually across bake pages. Three render locations:

1. **Bake log section** (recipe page) — compact weather summary per bake entry
2. **Bake detail page** — fuller weather context for the session
3. **Recipe page current-bake area** — ambient conditions display (multi-day bakes need consideration: which day's weather when `start_date` != `date`)

Visual requirements:
- Weather condition icons/graphics mapped from WMO codes → sunny, rainy, cloudy, windy, etc.
- Outdoor humidity display (distinct from existing `bulk_ambient_temps` which tracks indoor kitchen temp)
- High/low temp range
- Non-intrusive, uniform styling across all three locations
- Consistent with proofed. design system (stone palette, sharp borders, monospace accents)

Data source: `CookLogEntry.weather` — 33 entries already backfilled across 8 recipes. Type defined in `src/types/recipe.ts` as `BakeWeather` with fields: `location`, `date`, `temp_high_f`, `temp_low_f`, `humidity_avg_percent`, `condition`, `source`.

Parent work: PF-193 (weather capture + backfill) is Done. This task covers the display layer.
<!-- SECTION:DESCRIPTION:END -->
