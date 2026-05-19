---
id: DRAFT-112
title: Flour pricing tab on bake-log review page (HEB vs BSM)
status: Draft
assignee: []
created_date: '2026-05-19 17:14'
labels:
  - ungroomed
  - ux
  - cost
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On bake-log review page (`/review/bake/...` or cost surfaces), add a Flour pricing tab/section.

Lets the user pick the pricing source for flour ingredients per bake:
- HEB (via `mcp__heb__heb_product_search`) — commodity flours, KABF etc.
- BSM (via `mcp__bsm__bsm_product_search`) — Barton Springs Mill specialty / whole-grain / heritage grains.

UI surface: side-by-side options OR per-ingredient dropdown. User picks which price flows into recipe cost calc. Persist the choice on the cook_log entry, e.g. `cost.items[].sourceVendor: "heb" | "bsm"`, so future renders honor it.

BSM v1 search hits classes/tours too — use `product_type` filter or query the `all-flours` collection (39 products) for flour-only results.

Depends on BSM MCP being live (now true; registered in proofed/.mcp.json May 2026).

Groom before implementing — open Qs: HEB vs BSM toggle UX, schema migration for `sourceVendor`, how to handle mixed sources within one bake.
<!-- SECTION:DESCRIPTION:END -->
