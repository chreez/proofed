---
id: DRAFT-120
title: Resolve git conflict markers in checklist.md (S7 tested_range.min)
status: Draft
assignee: []
created_date: '2026-05-19 18:18'
labels:
  - bug
  - validation
  - tangent-from-PF-275
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`.claude/rules/validation/checklist.md` has unresolved git conflict markers around S7 (lines ~75-78):

```
<<<<<<< Updated upstream
| S7 | Scaling range & metadata valid | When `scaling` present: `tested_range.min >= 0.5`, ...
=======
| S7 | Scaling range & metadata valid | When `scaling` present: `tested_range.min >= 1`, ...
>>>>>>> Stashed changes
```

Likely stash-pop residue. Surfaced during PF-275 execution when about to add new Fxx rows below.

Decision needed: keep `min >= 0.5` (allows halving recipes) or `min >= 1` (only scale up)?

Not blocking PF-275 — new rows append below cleanly. But should be resolved soon.

Source: PF-275 execution session 2026-05-19.
<!-- SECTION:DESCRIPTION:END -->
