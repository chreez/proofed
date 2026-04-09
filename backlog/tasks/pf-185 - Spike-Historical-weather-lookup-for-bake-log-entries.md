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
- [x] #1 Evaluate ≥2 free weather APIs for historical hourly data by zip/coords + date
- [x] #2 Document rate limits, historical depth, and accuracy for each option
- [x] #3 Spot-check ≥3 known bake dates against a reliable source (e.g., Weather Underground) for accuracy validation
- [x] #4 Recommend architecture (MCP server / script / composable) with rationale
- [x] #5 Propose a `weather` data schema that stores raw hourly readings for flexible aggregation
- [x] #6 Confirm batch lookup is feasible (all timestamps per bake in ≤1 API call or minimal calls)
- [ ] #7 Demo subtask: mock up 2-3 non-distracting weather icon treatments in bake log UI context
- [x] #8 Document findings in spike notes on the parent task
<!-- AC:END -->

## Spike Findings & Architecture Decision

**Research completed 2026-04-09.** Full notes: `backlog/tasks/pf-185-spike-notes.md`

### API Decision: Open-Meteo (not Visual Crossing)

The original research recommended Visual Crossing, but a follow-up CORS evaluation changed the decision:

- **Visual Crossing** — requires API key, does NOT support CORS. Cannot be called from the browser.
- **Open-Meteo** — free, no API key, returns `Access-Control-Allow-Origin: *`. Browser-side fetches work directly.

Open-Meteo archive API: `archive-api.open-meteo.com/v1/archive` — supports historical hourly data by coords + date range. Single call fetches an entire month. No auth.

### Architecture: Combined Ambient + Weather Flow

Weather fetch is triggered alongside the indoor ambient temp reminder (PF-186) at bake start. One user prompt, two data captures:

1. **Bake starts** → scratchpad reminder fires: "Kitchen temp (°F)?"
2. **Simultaneous** → `useWeather(date, coords)` composable fetches outdoor weather from Open-Meteo (~200ms, no CORS issues)
3. **User enters indoor temp** → saved to `bake_stats.bulk_ambient_temps[0]`
4. **Weather response** → saved to `bake_stats.weather` (daily summary)

For backfill: same API, called with past dates during `/bake-log` sessions. Can batch entire months.

Graceful degradation: if API is down, weather field is absent. No error, no broken UX.

### Visual reference

Architecture flow diagram and frontend mockups: `public/demo/weather-flow.html` (served at `/demo/weather-flow.html` on dev server). **This demo should be removed when actual implementation ships.**

### Data shape (on cook_log entry)

```json
{
  "bake_stats": {
    "weather": {
      "source": "open-meteo",
      "fetched_at": "2026-04-09T08:30:05",
      "location": { "lat": 30.27, "lon": -97.74, "name": "Austin, TX" },
      "daily": {
        "temp_high_f": 84,
        "temp_low_f": 62,
        "humidity_avg_pct": 55,
        "condition": "Partly Cloudy",
        "precip_mm": 0
      }
    }
  }
}
```

### Remaining work

- AC #7 (weather icon treatments in bake log UI) deferred to implementation task
- Implementation tasks to be created when spike is closed
