---
id: PF-186
title: 'Spike: Indoor ambient temperature measurement reminder UX'
status: To Do
assignee: []
created_date: '2026-04-09 15:32'
labels:
  - spike
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Research the best UX pattern for prompting the baker to measure indoor ambient temperature as the very first step before every bake.

## Context
- Indoor ambient temp is the #1 variable affecting fermentation timing
- User wants to start measuring it as the first step, every single bake, no exceptions
- This is distinct from outdoor weather (separate spike)
- Currently not prompted anywhere in the recipe flow

## Options to explore
1. Add as a step/note in the recipe's first stage (e.g., "Measure kitchen temperature")
2. Fire as a StepReminder via useScratchpad when a bake session starts
3. A new "pre-bake checklist" concept that fires before stage 1
4. Something else the spike uncovers

## Recipe scoping
- New recipe-level tag (e.g., `requires_ambient_temp: true`) to flag which recipes trigger the prompt
- Most current recipes would get it, but tag keeps it configurable per recipe

## Hardware evaluation
- Ecobee thermostat API — can we query current indoor temp programmatically? Auth, accuracy, latency?
- Dedicated kitchen thermometer/hygrometer — always-on display at workstation, ideally with humidity
- Manual instant-read as fallback

## Key questions
- Where in the flow does it feel natural vs annoying?
- Should the value auto-populate `bake_stats.bulk_ambient_temps[0]`?
- Does this apply to all recipes or just fermented ones? (recipe tag controls this)
- How does it interact with the existing scratchpad/reminder system?
- Ecobee integration feasibility: API availability, auth complexity, accuracy vs dedicated sensor
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Evaluate ≥3 UX placement options for the ambient temp prompt (pre-bake checklist, scratchpad reminder, inline stage step, auto-capture); document pros/cons of each
- [x] #2 Propose a recipe-level tag schema for flagging which recipes require ambient temp capture
- [x] #3 Investigate Ecobee API for auto-capture: auth model, data availability, accuracy, feasibility
- [x] #4 Recommend ≥2 dedicated kitchen thermometer/hygrometer options with price and features
- [x] #5 Propose how captured value flows into `bake_stats` (field name, auto-populate vs manual entry)
- [x] #6 Document interaction with existing scratchpad/reminder system
- [ ] #7 Demo subtask: mock up the top 2 UX placements in recipe page context
<!-- AC:END -->

## Spike Findings & Architecture Decision

**Research completed 2026-04-09.** Full notes: `backlog/tasks/pf-186-spike-notes.md`

### User Decisions (2026-04-09)

- **Temperature unit:** °F only. No conversion logic needed.
- **Capture frequency:** One reading at bake start for MVP. Future consideration for additional data points mid-bake.
- **Timestamps:** Store UTC, display local timezone. (Scratchpad already uses `new Date().toISOString()` which is UTC — consistent.)

### UX Decision: Scratchpad Reminder (Option B)

Pre-bake scratchpad reminder fires "Kitchen temp (°F)?" before first stage. Non-blocking, dismissible, reuses existing `useScratchpad.addReminderResponse()` with reserved `stepId="_pre_bake"`. No new UI patterns needed.

### Hardware Decision: Shelly H&T (~$35)

Ecobee API is **discontinued** (March 2024). GOVEE H5179 was evaluated but **rejected** — WiFi requires Govee's cloud; HA integration is Bluetooth-only with limited range.

**Selected: Shelly H&T** — fully local WiFi HTTP API, native Home Assistant `shelly` integration, no hub, no cloud, no subscription. Battery ~1yr, permanent kitchen placement. Manual entry for MVP, potential local API integration later.

### Data Flow

1. Bake starts → scratchpad reminder fires
2. User enters kitchen temp (reads Shelly display or any thermometer)
3. Value saved to scratchpad via `addReminderResponse()`
4. Post-bake: extracted to `bake_stats.bulk_ambient_temps[0]`

No schema changes needed — `bulk_ambient_temps` field already exists in `BakeStatsBlock` types.

### Recipe tag: `config.ambientTempTracking`

```typescript
ambientTempTracking?: {
  required: boolean      // reminder fires for every bake
  minReadings: number    // default 1
  stages: string[]       // stage IDs for capture points
  note?: string          // custom reminder text
}
```

### Combined with PF-185 (Weather)

When the ambient temp reminder fires, the app simultaneously fetches outdoor weather from Open-Meteo in the background. One user prompt, two data captures. See `public/demo/weather-flow.html` for the combined architecture diagram.

### Remaining work

- AC #7 (UX placement demo) deferred to implementation task
- Implementation task to be created when spike is closed
