---
id: PF-210
title: Weather data UI — condition icons + humidity display on bake pages
status: To Do
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

1. **Bake log section** (recipe page) — weather badge inline with date/version header (Option B from demo)
2. **Bake detail page** — compact inline weather row (Variant 2 from demo)

Visual requirements:
- Weather condition icons/graphics mapped from WMO codes → sunny, rainy, cloudy, windy, etc.
- Outdoor humidity display (distinct from existing `bulk_ambient_temps` which tracks indoor kitchen temp)
- High/low temp range
- Non-intrusive, uniform styling across all three locations
- Consistent with proofed. design system (stone palette, sharp borders, monospace accents)

Data source: `CookLogEntry.weather` — 33 entries already backfilled across 8 recipes. Type defined in `src/types/recipe.ts` as `BakeWeather` with fields: `location`, `date`, `temp_high_f`, `temp_low_f`, `humidity_avg_percent`, `condition`, `source`.

Parent work: PF-193 (weather capture + backfill) is Done. This task covers the display layer.

Demo reference: `public/demo/weather-ui.html` (clean up when implementation ships).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `CookLogSection.vue` renders a weather badge inline in the date/version header row when `entry.weather` is present — shows condition icon, high°/low° temp range, and humidity percentage
- [ ] #2 Condition icon maps WMO text values to visual icons: Clear sky, Overcast, Rain, Drizzle (+ reasonable fallback for unmapped conditions)
- [ ] #3 Weather badge silently omitted when `entry.weather` is absent — no placeholder, no "N/A" text
- [ ] #4 `BakeDetailView.vue` renders a compact inline weather row (Variant 2 from demo) between the header and summary sections — condition icon, condition name, temp range, humidity, location
- [ ] #5 Weather row on bake detail silently omitted when `entry.weather` is absent
- [ ] #6 Badge and row use proofed. design system tokens (font-mono, stone palette, border style) — no one-off colors or fonts
- [ ] #7 Badge wraps gracefully on mobile (≤375px) — does not cause horizontal overflow or truncate date text
- [ ] #8 Snapshot tests updated for CookLogSection and BakeDetailView reflecting new weather elements
- [ ] #9 `npm run build` passes
- [ ] #10 Demo file `public/demo/weather-ui.html` cleaned up (deleted) after implementation ships
<!-- AC:END -->
