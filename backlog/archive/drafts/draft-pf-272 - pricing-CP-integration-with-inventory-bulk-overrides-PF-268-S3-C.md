---
id: DRAFT-PF-272
title: /pricing CP integration with /inventory bulk overrides (PF-268 S3-C)
status: Draft
assignee: []
created_date: '2026-05-14 20:31'
labels:
  - bakery-ops
  - inventory
  - pricing
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-268 design notes §8. Extend the /pricing lens (post PF-255.1) to consult bake-cost-profile.bulkOverrides BEFORE cost-rates.json when computing CP. When an override is active, the price tag in /pricing shows the bulk-unlocked rate, provenance = 'bulk', and a small badge: 'unlocked: 25 lb tier'. When the bulk lot depletes in inventory, the override auto-expires and CP reverts. Depends on /inventory route + composables AND /inventory skill drafts.
<!-- SECTION:DESCRIPTION:END -->
