---
id: DRAFT-122
title: Implement word-boundary matching in useTechniques
status: Draft
assignee: []
created_date: '2026-07-04 20:34'
labels:
  - ungroomed
  - ux
  - tech-debt
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Source

PF-283 spike recommendation (2026-07-04). Word-boundary matching (approach B) fixes 100% of observed technique-glossary false positives (66/66) with zero recipe-data migration.

## Change

Modify `parseTextWithTechniques` and `findTechnique` in `src/composables/useTechniques.ts` to use word-boundary regex matching:

```ts
// current: substring match
const index = lowerRemaining.indexOf(lowerKeyword)

// new: word-boundary match
const re = new RegExp(`\\b${escapeRegex(lowerKeyword)}\\b`, 'i')
const match = re.exec(remaining)
const index = match?.index ?? -1
```

## Acceptance Criteria

1. Both matcher functions use `\b<keyword>\b` regex, not `.indexOf(keyword)`
2. Regex source strings escape special regex chars in keys (via helper)
3. Existing tests still pass
4. New tests:
   - `parseTextWithTechniques('let rest at room temperature')` returns single text chunk (no `room temp` false match)
   - `parseTextWithTechniques('Unsalted Butter (room temp)')` still matches `room temp` (parens are non-word chars)
   - `parseTextWithTechniques('melted butter')` still matches `melted`
   - Special-char key `warm to 43°C` still matches its target text
5. Run `npm run audit:techniques` post-change → subset_match count must be 0
6. Build passes (2866+ tests)

## Out of scope

- Rename cream cheese ingredient in tartine-rugelach (separate follow-up)
- Audit script CI integration (separate follow-up)
- Annotation approach (not needed per audit data)
<!-- SECTION:DESCRIPTION:END -->
