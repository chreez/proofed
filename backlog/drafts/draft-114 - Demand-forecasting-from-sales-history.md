---
id: DRAFT-114
title: Demand forecasting — show "avg sold last N markets" in /production
status: Draft
assignee: []
created_date: '2026-05-19'
labels:
  - bakery-ops
  - pf-256
  - production
  - sales
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: 2026-05-19 market-workflow gap. Sales history (PF-256.5/6) has the data — "last 3 markets I sold 18 sourdoughs." `/production` doesn't surface it when sizing the next plan. Evidence-based sizing > by-feel.

## Scope
- New helpers in `useSales.ts` (or new `useSalesHistory.ts`):
  - `averageSoldPerMarket(recipeId, lastN = 3): number | null` — average across last N closed sessions, null if N < 1
  - `medianSoldPerMarket(recipeId, lastN = 3): number | null`
  - `marketHistorySummary(recipeId): { avg, median, max, lastNMarkets, dates[] }`
- `/production` library row: small muted line under bake count: "avg sold last 3 markets: ~14" (when data exists). Hidden when no history.
- `/production` cart entry: suggestion next to qty stepper — "rec: 16 batches (~14 avg × 1.2 safety)" with one-click "accept suggestion" action that sets batches accordingly.
- Empty/missing data renders gracefully — no scary nulls.

## Proposed ACs
1. `useSalesHistory.ts` (or extended `useSales.ts`) exports `averageSoldPerMarket(recipeId, lastN)` returning `number | null`.
2. Library row shows "avg ~N sold last 3 markets" below bake count; only when at least 1 prior session exists.
3. Cart entry shows "rec: N batches" suggestion when sales history exists for the recipe, with click-to-accept setting `entry.batches`.
4. Safety-buffer multiplier configurable (default 1.2× avg, round up to whole batches via baseYield).
5. Unit tests cover ≥3 sessions, 1 session, no sessions, mixed transaction shapes (PF-256.5 legacy + PF-256.6 new).
6. F43 tooltips on the suggestion explain the math.
<!-- SECTION:DESCRIPTION:END -->
