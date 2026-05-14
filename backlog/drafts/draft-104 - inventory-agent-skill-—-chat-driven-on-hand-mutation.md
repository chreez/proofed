---
id: DRAFT-104
title: /inventory agent skill — chat-driven on-hand mutation
status: Draft
assignee: []
created_date: '2026-05-14 20:32'
labels:
  - bakery-ops
  - inventory
  - skill
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-268 design notes §9. Build the /inventory skill that mutates bake-inventory-current via natural-language input (e.g. '+1 lb butter purchased today', 'used 500g flour for sourdough', 'open the egg carton'). Mirrors /bake-log pattern: clarify loop, echo back, then write. Supports canonicalId typeahead from the catalog. Also exposes inventoryDeplete(canonicalId, grams, lotId?) callable from /bake-log at cook_log write time. Depends on DRAFT-103 (/inventory route + composables).
<!-- SECTION:DESCRIPTION:END -->
