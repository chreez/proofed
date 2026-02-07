---
id: PF-38
title: Verifiable source tracking for agent research
status: To Do
assignee: []
created_date: '2026-02-07 01:08'
updated_date: '2026-02-07 20:38'
labels:
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Unified source/citation tracking for recipe data. Three scopes decomposed into subtasks:\n\n1. **Recipe origin + suggestion citations** (PF-38.1 spike → PF-38.2 implement)\n2. **Agent research provenance** (PF-66 — schema with confidence ratings, per-ingredient sourcing)\n3. **Display: recipe appendix** (PF-69 — \"How was this recipe generated?\" UI)\n\nPF-38 parent tracks the overall initiative. No direct implementation on the parent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All subtasks complete (PF-38.1, PF-38.2)
- [ ] #2 PF-66 (research provenance schema) complete
- [ ] #3 PF-69 (recipe appendix UI) complete
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Subtask Structure\n\n- **PF-38.1** — Spike: research citation schemas (JSON-LD, schema.org, custom)\n- **PF-38.2** — Implement recipe origin + suggestion citations (blocked by 38.1)\n- **PF-66** — Research provenance schema (agent research scope, depends on PF-38)\n- **PF-69** — Recipe appendix UI (depends on PF-66)\n\n## Context\n\nThe CoCo curry research session (2026-02-07) produced a concrete test case: 8 parallel search agents, 45+ sources, cross-source confidence ratings. Synthesis report was in scratchpad at `coco-curry-research-synthesis.md`."
<!-- SECTION:NOTES:END -->
