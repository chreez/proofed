---
id: DRAFT-124
title: 'Wire audit:techniques into build gate as regression check'
status: Draft
assignee: []
created_date: '2026-07-04 20:35'
labels:
  - ungroomed
  - tech-debt
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Source

PF-283 spike deliverable 5c. `scripts/audit-techniques.ts` currently emits summary + JSON dump; converting it into a build gate protects against future regressions of the substring-matching class of bugs.

## Change

Add exit-code semantics to `audit-techniques.ts`:

- 0 = no mismatches (subset_match count == 0 AND ingredient_context count == 0)
- 1 = any mismatch present

Add `audit:techniques` to `prebuild` script so `npm run build` fails if a new recipe introduces a false-positive match. Optionally, allow env override `AUDIT_ALLOW_MISMATCH=1 npm run build` for local iteration.

## Acceptance Criteria

1. `scripts/audit-techniques.ts` returns non-zero exit code if any mismatch category > 0
2. `package.json` `prebuild` script runs `npm run audit:techniques` before test/coverage
3. `AUDIT_ALLOW_MISMATCH=1` env var suppresses the failure (dev escape hatch)
4. Build fails with descriptive error if a new recipe adds a `room temp`/similar false positive
5. Documentation added to CLAUDE.md `Snapshot Tests` section (or new "Audit gates" section) explaining the gate

## Blocked by

Word-boundary matcher change must land first — without it, current audit reports 66 mismatches and the build would immediately fail on this gate.
<!-- SECTION:DESCRIPTION:END -->
