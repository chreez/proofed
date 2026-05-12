---
id: DRAFT-87
title: 'Audit D4 (timer:true ONLY on passive states) across recipe corpus'
status: Draft
assignee: []
created_date: '2026-05-12 13:11'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255.3 spike §6. ny-style-pizza.json has COLD_BULK_FERMENT (720 min) and COLD_PROOF (2880 min) with timer:false despite both being multi-hour passive cold rests. Per CLAUDE.md rule D4 ('timer: true ONLY on passive states like rise, bake, cool'), these SHOULD have timer:true. Either the JSON is wrong (fix it) or the rule's intent excludes overnight cold rests (revise CLAUDE.md). Audit all 26 recipes for similar violations. Pick the canonical interpretation, fix divergent recipes.
<!-- SECTION:DESCRIPTION:END -->
