---
id: PF-182
title: Reimagine baking cadence as browsable contribution calendar
status: To Do
assignee: []
created_date: '2026-04-08 19:18'
updated_date: '2026-04-08 19:40'
labels:
  - stats
  - ux
  - performance
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Goal

Replace the current "Baking Cadence" horizontal timeline on `/stats` with a GitHub-style contribution calendar — a 7-row × ~53-column grid showing the rolling last 12 months of bake activity. Binary cells (baked / didn't), hover reveals the existing hero-thumb popover, click navigates to the bake detail page.

## Visual reference

GitHub's contribution graph:
- 7 rows (Sun → Sat), ~53 week columns
- Month labels along the top, alternating weekday labels (Mon / Wed / Fri) on the left
- Headline count above the grid: "N contributions in the last year"
- Rolling 12-month window

proofed adaptation:
- 0-radius square cells, stone palette, monospace labels
- **Binary intensity**: accent for normal bake days, stone-400 for aberration-only days, empty/muted for no bake
- Mixed days (normal + aberration) render as normal bake (accent wins)
- Reuses the existing `TimelineBakeInfo` popover pattern from `StatsPage.vue` (hero thumbnail + recipe name + click → bake detail)

## Behavior

- **Replace, don't augment**: the existing `ds3-timeline-*` dot-line section is removed entirely
- **Rolling 12 months only**: older bakes stay visible in the per-group sections below but not on the calendar
- **Hover** opens the popover; **click** on a popover entry navigates via `router.push({ name: 'bake-detail', ... })`
- **Mobile**: horizontal scroll on narrow viewports (calendar stays wide, overflows its container)
- **In-progress bakes** (`entry.status === 'in_progress'`) are excluded, matching current timeline behavior

## Implementation decision: spike first

The build-vs-library question is deferred to a spike subtask (see PF-XX.1) because:
- Off-the-shelf Vue 3 options exist (`vue3-calendar-heatmap` by razorness, SVG-based, npm, TypeScript) but default tooltips are text-only via Tippy.js — won't render hero-thumb popovers
- Building from scratch is ~100-200 lines of Vue SVG but gives full control + brand fit
- The spike will also evaluate whether a precomputed `public/recipes/bake-index.json` (date → bake count + recipe refs) replaces runtime derivation from recipe JSONs

GitHub's own contribution graph component is proprietary (not open-sourced), but there are multiple third-party clones across React and Vue. The spike picks the winning approach before implementation begins.

## Context

- Current timeline: `src/components/StatsPage.vue:636-692` (template), `:1006-1067` (styles), `:391-576` (data + popover logic)
- Reusable popover pattern: `TimelineBakeInfo`, `showPopover`, `navigateToBake`, `Teleport to body` popover — all present in `StatsPage.vue`
- Cook log data source: `public/recipes/*.json` → `cook_log[]` with `date` field
- Related tasks: PF-181 (removed per-recipe bars — already Done)

## References

- [vue3-calendar-heatmap (razorness)](https://github.com/razorness/vue3-calendar-heatmap) — closest Vue 3 / TypeScript option
- [vue3-calendar-heatmap npm](https://www.npmjs.com/package/vue3-calendar-heatmap)
- [react-calendar-heatmap](https://github.com/kevinsqi/react-calendar-heatmap) — React, reference only
- GitHub's own component is proprietary (not open-sourced)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The current "Baking Cadence" horizontal timeline on /stats (including all ds3-timeline-* markup in StatsPage.vue) is replaced in the same position by a contribution calendar.
- [ ] #2 Calendar follows GitHub shape: 7 rows (Sun → Sat), ~53 week columns, one cell = one day.
- [ ] #3 Calendar shows a rolling 12-month window ending today; bakes older than 12 months do not render on the calendar (they remain visible in the per-group sections below).
- [ ] #4 Month labels render along the top edge (Apr, May, Jun, ...) and weekday labels render on the left with alternating density (Mon / Wed / Fri), matching the GitHub reference.
- [ ] #5 Cells are binary: no bake = empty/muted, normal bake day = accent, aberration-only day = stone-400.
- [ ] #6 Days with both a normal bake and an aberration render as a normal bake (accent wins).
- [ ] #7 In-progress bakes (entry.status === 'in_progress') are excluded from the calendar, matching current timeline behavior.
- [ ] #8 Hovering a cell with ≥1 bake opens a popover showing each bake's recipe name, hero thumbnail, and date, reusing the TimelineBakeInfo + hero-thumb popover pattern from StatsPage.vue.
- [ ] #9 Clicking a popover entry navigates to router name 'bake-detail' with params { recipeId, date }, matching current navigateToBake behavior.
- [ ] #10 Popover positioning, hover-out delay, and click-outside-to-close behavior match the current timeline popover.
- [ ] #11 Visual style matches proofed brand: 0-radius square cells, stone palette, monospace month/day labels, cell gaps consistent with GitHub density.
- [ ] #12 A headline count renders above the grid in the format "{N} bake sessions in the last 12 months" (mirrors GitHub's "1,323 contributions in the last year").
- [ ] #13 On narrow viewports the calendar overflows horizontally with scroll; cells stay ≥12px for readability and tap targets.
- [x] #14 A spike subtask prototypes vue3-calendar-heatmap vs from-scratch implementation and locks the winning approach before implementation begins.
- [x] #15 The spike also decides whether a precomputed public/recipes/bake-index.json (date → bake count + recipe refs) replaces runtime derivation from recipe JSONs, or whether runtime derivation stays.
- [ ] #16 Snapshot tests for StatsPage.vue are updated to reflect the new DOM (old ds3-timeline-* snapshots removed, new calendar snapshots added).
- [ ] #17 npm run build passes (tests + type-check + bundle).
- [ ] #18 Visual HITL approval obtained before commit (labels: ux, stats).
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Spike decision: PF-182.1 (2026-04-08)

### Approach: Option B (from-scratch Vue SVG)

**Rationale:** `vue3-calendar-heatmap` is a dead-end for the rich popover requirement. Its `tooltipFormatter` returns a plain string rendered via Tippy.js — HTML injection works, but Vue component mounting, `@click` wiring, and `router.push` binding do NOT. The library emits `@dayClick` on cells, so click navigation is possible, but hover-to-preview a multi-bake day is blocked by the inert Tippy DOM. On top of that: `SQUARE_SIZE = 10` is hardcoded (not a prop), the component ships a global SCSS block that fights our brand (Apple system font, `#767676` label fill, `#555` hover stroke), last published 2023-03-20 (3 years unmaintained), unpacks 141 KB + bundled Tippy. Option B lets us lift-and-shift the existing popover pattern (lines 491-591 in StatsPage.vue) wholesale — `getBoundingClientRect()` works identically on SVG `<rect>` elements, `navigateToBake` stays in the parent. Estimated 150-180 LOC for `ContributionCalendar.vue`, ~50 LOC net diff in `StatsPage.vue` (mostly deletions of the horizontal timeline).

### Index decision: bake-index.json — NO (defer, revisit at N > 50 recipes)

**Rationale:** Runtime derivation currently pulls 855 KB across 20 recipe JSON files on every `/stats` mount. A precomputed `bake-index.json` would be 5.05 KB minified — a 99.4% payload reduction for the calendar specifically. BUT `StatsPage.vue` already uses those 20 fetches for group sections, subgroups, production mix, Pantry Ledger, calories, and nutrition. Adding a calendar-only index doesn't reduce any fetches — it adds 5 KB on top of 855 KB. The real win would require a combined `stats-index.json` covering all stats sections — a much bigger refactor that belongs in its own PF task. At current scale (20 recipes, 25 cook_log entries, 24 unique dates), runtime derivation is <100 ms on desktop and network cost is dominated by hero thumbs users already cache. Revisit triggers: recipe count > 50, total stats payload > 2 MB, or a new standalone calendar route that doesn't need the rest of stats.

**Current state:** 20 recipe JSONs, 875,578 bytes (855.1 KB) fetched on /stats mount, 25 cook_log entries across 24 unique dates, 12 of 20 recipes (60%) have zero cook_log entries.

### Grid dimensions (locked)

| Property | Value |
|---|---|
| Cell size | 14px (fallback: 12px if container overflow unacceptable) |
| Cell gap | 3px (fallback: 2px) |
| Month label font | 10px JetBrains Mono, --color-stone-400 |
| Weekday label font | 9px (Mon/Wed/Fri only) |
| Weekday label column | 28px |
| Top label row | 16px |
| Total grid width | 929px (14/3) or 771px (12/2) |
| Total grid height | 135px (14/3) or 114px (12/2) |
| Narrow viewport min | 12px cells, 2px gap, overflow-x scroll |

**Note:** At 14px/3px the grid width (929px) exceeds the current `ds3` container `max-width: 52rem (832px)` at StatsPage.vue:869. Options during implementation: (a) wrap calendar in `overflow-x: auto` container scoped to the calendar only, or (b) drop to 12/2 for a clean fit. Start with 14/3 + overflow, fall back at HITL review if user dislikes the scroll.

### Implementation notes for PF-182

- **Parent owns popover, child emits** — keep `activeTimelineDot`, `popoverPosition`, `activePopoverBakes`, `showPopover`, `hidePopover`, `togglePopover`, `navigateToBake`, `popoverStyle`, `<Teleport to="body">` in `StatsPage.vue`. Calendar emits `cellHover(bakeDay, ev)` and `cellClick(bakeDay, ev)`. Rename `activeTimelineDot` → `activeCalendarDate` (still ISO string).
- **Data derivation stays in `loadData`** (StatsPage.vue:105-244). `timelineBakeMap` already has `Map<string, TimelineBakeInfo[]>` shape. Rename `timelineDots` → `calendarBakeDays`, drop `dayOffset`/`percent` (grid positions come from week index). Delete lines 391-466 (`timelineStart/End/SpanDays/Dots/Labels`) — week-indexing replaces offset math.
- **`start_date` intentionally ignored** — cook_log `date` is day-of-consumption, matching existing horizontal timeline behavior (e.g., simple-sourdough with `start_date: 2026-03-10, date: 2026-03-12` lights up only 3/12).
- **Rolling window anchors to `new Date()`**, not the latest cook_log date. Matches GitHub.
- **Weekday padding:** blank transparent cells before the earliest Sunday and after the last Saturday; no listeners on blanks.
- **Empty-day hover:** early return if `bakeMap.get(iso) === undefined`. Don't emit on empty cells.
- **Files to touch in PF-182:**
  - `src/components/ContributionCalendar.vue` (new, ~150-180 LOC)
  - `src/components/StatsPage.vue` — replace ds3-timeline section (lines 636-692), delete CSS block (986-1067), keep popover CSS (1490-1546) unchanged
  - No recipe JSON changes, no new deps
- **Mobile popover positioning** — existing logic (StatsPage.vue:502-526) assumes horizontal timeline with fixed `top`. Calendar cells have arbitrary x/y inside SVG. Revalidate viewport-edge detection for top-row cells (popover may need vertical flip when cell is in first row). Add flip logic if needed during PF-182 implementation, test popover in all four corners of the grid.
- **Accessibility:** `role="img"` + `aria-label="Baking cadence — last 12 months, N bake days"` on root SVG; `<title>` inside each non-empty `<rect>` as screen-reader fallback.
- **Testing hooks to add during PF-182:**
  - Snapshot for `ContributionCalendar.vue` (join existing snapshot corpus)
  - Unit test for week-builder helper (rolling 12-month window → 53 weeks, correct DOW alignment at both ends)
  - Integration: known `bakeMap` → expected accent/stone-400/stone-100 fill counts

### Cleanup confirmation

- No packages installed (package.json unchanged)
- No files created in src/
- No changes to public/recipes/
- Research-only: Read, Glob, Grep, WebFetch
<!-- SECTION:NOTES:END -->
