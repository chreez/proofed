---
id: DRAFT-53
title: Ambient temp pre-bake reminder — scratchpad integration + recipe config tag
status: Draft
assignee: []
created_date: '2026-04-09 18:58'
labels:
  - feature
  - ux
dependencies: []
references:
  - backlog/completed/pf-186-spike-notes.md
  - public/demo/weather-flow.html
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the ambient temperature capture flow decided in PF-186 spike.

## Spike Reference
Full architecture decision and research notes: `backlog/completed/pf-186-spike-notes.md`

## Key Decisions from Spike
- **UX**: Pre-bake scratchpad reminder fires "Kitchen temp (°F)?" before first stage. Non-blocking, dismissible, reuses `useScratchpad.addReminderResponse()` with reserved `stepId="_pre_bake"`.
- **Unit**: °F only — no conversion logic needed
- **Capture frequency**: One reading at bake start (MVP)
- **Timestamps**: Store UTC, display local timezone (consistent with existing scratchpad `new Date().toISOString()`)
- **Hardware**: Shelly H&T for reading, but MVP is manual entry only — no API integration yet
- **Data flow**: User enters temp → saved via `addReminderResponse()` → post-bake extracted to `bake_stats.bulk_ambient_temps[0]`

## Combined Flow with PF-185 (Weather)
When the ambient temp reminder fires, the app simultaneously fetches outdoor weather from Open-Meteo in the background. One user prompt, two data captures. See `public/demo/weather-flow.html` for the combined architecture diagram.

## Recipe Config Tag
Add `config.ambientTempTracking` to recipe JSON schema — controls which recipes trigger the reminder and how many readings are expected. Schema defined in spike notes.

## Scope
- Scratchpad reminder integration (pre-bake prompt)
- Recipe-level `config.ambientTempTracking` tag schema + type definitions
- Wire captured value into `bake_stats.bulk_ambient_temps`
- Coordinate with PF-185 weather capture for combined flow
- AC #7 from PF-186 (UX placement demo) can inform final visual design
<!-- SECTION:DESCRIPTION:END -->
