---
id: PF-245
title: 'Fix HTML semantics warning: tr outside tbody in demo tables'
status: To Do
assignee: []
created_date: '2026-05-10 02:56'
updated_date: '2026-05-10 04:09'
labels:
  - bug
  - demo
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Source

Vite emits client-side warning during dev for demo pages:

`<tr> cannot be child of <table>, according to HTML specifications. This can cause hydration errors or potentially disrupt future functionality.`

Surfaced during PF-237 HITL on 2026-05-09. First flagged location: `src/components/DemoPrintNav.vue` lines 116-119. Other demo files have the same pattern.

## Problem

Several Demo*.vue files use `<table>` with direct `<tr>` children, no wrapping `<thead>` or `<tbody>`. Browsers auto-insert `<tbody>` at runtime, so the visual rendering is fine, but Vue compiler-sfc warns and SSR/hydration can mismatch.

## Files with this issue (grep result, 2026-05-09)

- `src/components/DemoPrintNav.vue`
- `src/components/DemoCostPicker.vue`
- `src/components/DemoScratchpad.vue`
- `src/components/DemoStats.vue`
- `src/components/DemoStatsBlock.vue`
- `src/components/DemoStateNoteTables.vue`

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 #1 Every `<table>` in src/components/Demo*.vue uses explicit `<thead>` (when there are header rows) and `<tbody>` wrappers around `<tr>` elements
- [ ] #2 #2 `npm run dev` shows zero `<tr> cannot be child of <table>` warnings in the Vite client console when navigating to /demo/* routes
- [ ] #3 #3 Visual rendering of every demo page is unchanged (manual diff or screenshot compare on 1-2 representative pages)
- [ ] #4 #4 Snapshot tests for any covered demo component pass without --update; if any snapshot legitimately needs to update due to <tbody> wrapper inserting in the HTML, that is documented in the commit message
- [ ] #5 #5 `npm run build:fast` passes (vue-tsc clean)

## Out of scope

- Production components (StateStep.vue, RecipeMeta.vue, etc.) — none currently flagged
- Behavioral or styling changes — fix is structural HTML only
<!-- SECTION:DESCRIPTION:END -->

- [ ] #6 Every <table> in src/components/Demo*.vue uses explicit <thead> (when there are header rows) and <tbody> wrappers around <tr> elements
- [ ] #7 npm run dev shows zero '<tr> cannot be child of <table>' warnings in the Vite client console when navigating to /demo/* routes
- [ ] #8 Visual rendering of every demo page is unchanged (manual diff or screenshot compare on 1-2 representative pages)
- [ ] #9 Snapshot tests for any covered demo component pass without --update; if any snapshot legitimately needs to update due to <tbody> wrapper inserting in the HTML, that is documented in the commit message
- [ ] #10 npm run build:fast passes (vue-tsc clean)
<!-- AC:END -->
