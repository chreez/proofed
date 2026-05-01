---
id: PF-230
title: Fix autolyse step — missing levain amount
status: Done
assignee: []
created_date: '2026-05-01 04:23'
updated_date: '2026-05-01 04:50'
labels:
  - bug
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Bug

Autolyse Rest state in jalapeno-cheddar-sourdough.json says "Place the ripe levain on top of the dough" but doesn't specify how much. Levain build produces ~110g (10g starter + 50g flour + 50g water). Should say \"Place all ~110g of ripe levain on top.\"\n\n## Context\n\nUser considering whether to keep levain build or simplify to \"use 100g active starter.\" Either way, the amount must be explicit in the autolyse direction text.\n\n## AC\n- [ ] Autolyse Rest direction specifies levain amount in grams\n- [ ] Amount is consistent with levain build ingredients (10+50+50=110g)
<!-- SECTION:DESCRIPTION:END -->
