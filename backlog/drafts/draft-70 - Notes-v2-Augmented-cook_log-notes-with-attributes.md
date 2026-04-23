---
id: DRAFT-70
title: 'Notes-v2: Augmented cook_log notes with attributes'
status: Draft
assignee: []
created_date: '2026-04-23 18:40'
labels:
  - 'epic:DRAFT-69'
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Unified bake notes schema replacing fragmented notes[] / key_notes[] / raw_notes with a single timestamp-indexed BakeNote[] structure. Each note preserves raw user input alongside agent curation, with metadata tracking what the agent did with each entry. Raw input is never lost — every note carries verbatim text + UTC timestamp from the scratchpad JSON, with agent processing layered on top.

### Design Decisions (Groomed)
- **Type strategy**: Extend existing types (no NoteV2 — add BakeNote as new unified type)
- **Time format**: UTC ISO 8601 in JSON, local time in UI
- **Migration**: Backfill where raw_notes exist (5 bakes with scratchpad JSON), verify UTC conversion, high-confidence only
- **Skill behavior**: Verbatim raw entries in BakeNote.raw, agent prose in BakeNote.curated
- **Deprecation**: raw_notes field deprecated (data lives inline per-note)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

- [ ] **AC1: BakeNote type defined** — `BakeNote` interface in `src/types/recipe.ts` with required fields: `timestamp` (UTC ISO 8601), `raw` (verbatim user text), `notable` (boolean). Optional: `stepId`, `prompt`, `curated`, `processing`. `CookLogEntry` gains `bake_notes?: BakeNote[]`.
- [ ] **AC2: Renderer fallback chain** — BakeDetailView renders `bake_notes` when present (curated text for `notable: true` entries). Falls back to `key_notes` → `notes[]` when absent. No visual regression on old bake entries.
- [ ] **AC3: Timestamps stored UTC, displayed local** — All `BakeNote.timestamp` values are UTC ISO 8601. Front-end converts to local time for display. Multi-day grouping uses local date derived from UTC.
- [ ] **AC4: Bake-log skill writes BakeNote[] from scratchpad** — Phase 2 parses scratchpad JSON into `BakeNote[]` (one per entry). Agent sets `curated`, `notable`, `processing`. `stepId` and `prompt` carried from scratchpad.
- [ ] **AC5: Echo check shows raw + curated side-by-side** — Phase 3 echo presents each BakeNote with raw and curated visible. User can correct curated text, flip notable, or flag processing errors.
- [ ] **AC6: Raw scratchpad backup before processing** — Scratchpad JSON saved to disk before agent processing begins. Backup survives if processing goes wrong.
- [ ] **AC7: raw_notes field deprecated** — New entries omit `raw_notes`. Existing `raw_notes` left in place. Type annotation marked `@deprecated`.
- [ ] **AC8: Backfill 5 bakes with raw_notes** — Parse existing scratchpad JSON into `BakeNote[]`. UTC conversion verified per-entry. Confidence noted per bake. Secondary verification pass on local time rendering.
- [ ] **AC9: CookLogSection card count** — Summary card shows note count from `bake_notes` (notable entries) when present, falls back to `key_notes.length` or `notes.length`.
- [ ] **AC10: Build passes** — `npm run build` exits 0. Snapshot tests updated if BakeDetailView structure changes.
