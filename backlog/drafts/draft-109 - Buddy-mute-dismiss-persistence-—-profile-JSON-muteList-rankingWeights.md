---
id: DRAFT-109
title: Buddy mute/dismiss persistence — profile JSON muteList + rankingWeights
status: Draft
assignee: []
created_date: '2026-05-14 20:32'
labels:
  - engineer
  - scheduler
  - bakery-ops
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-270 design §7 + §9. Three flavors of mute: session (no storage), 30-day decay (default for × dismiss), permanent never-suggest (long-press / right-click). Stored as unordered pair keys: { recipeA: min(id1,id2), recipeB: max(id1,id2), mutedAt, expiresAt? }. Also persists rankingWeights for the Optimize-for toggle (Profit / Ease / Cleanup). Lives in PF-255.5 profile schema.
<!-- SECTION:DESCRIPTION:END -->
