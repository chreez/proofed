---
id: DRAFT-119
title: Bakery-ops workflow glue — cross-lens nav bar
status: Draft
assignee: []
created_date: '2026-05-19'
labels:
  - bakery-ops
  - pf-256
  - nav
  - cross-cutting
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: 2026-05-19 workflow gap. /production, /pricing, /labels, /sales are isolated routes. User has no persistent indicator of where they are in the workflow or what's next. Need a "glue" surface that ties the lenses together and shows pipeline state at a glance.

Mirrors the existing tab-bar pattern at /index / /bake-log / /stats.

## Scope
- New `BakeryOpsNav.vue` component: horizontal tab bar with 5 tabs — `Plan · Price · Labels · Sales · Export`.
- Rendered above the page content on all bakery-ops routes (`/production`, `/pricing`, `/labels`, `/sales`, optionally `/checklist`).
- Current route's tab highlighted.
- Numeric badges where useful: `Plan (3)` (queued count), `Sales · live` (active session badge), `Labels (3)` (= count of cards waiting to print).
- Each tab also acts as link — single-tap nav between lenses.
- Mobile: tabs stay horizontally scrollable if needed; sized for touch.
- Visual language matches existing nav pattern (stone-200 bg, JetBrains Mono labels, 2px ink underline on active).

## Proposed ACs
1. `BakeryOpsNav.vue` component renders the 5 tabs in fixed order.
2. Bar appears on `/production`, `/pricing`, `/labels`, `/sales` (App.vue route-meta dispatch).
3. Active tab highlighted; click navigates router.
4. Plan tab shows count badge when `ProductionPlan.entries.length > 0`.
5. Sales tab shows "live" badge (accent dot) when active session exists.
6. Labels tab shows count = production entries with bakeDate ≤ today + 1 day.
7. Export action lives as a tab or icon at far right (triggers `downloadSnapshot`).
8. Mobile-responsive: horizontally scrollable if viewport <640px; tabs sized 44×44 target.
9. F43 tooltips on each tab.
10. Snapshot test for nav in 2-3 states (live session vs not, plan-empty vs not).
<!-- SECTION:DESCRIPTION:END -->
