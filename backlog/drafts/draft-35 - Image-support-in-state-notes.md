---
id: DRAFT-35
title: Image support in state notes
status: Draft
assignee: []
created_date: '2026-04-08 16:51'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
State notes currently only support text (`StateNote` type in `src/types/recipe.ts` has `text`, `critical`, `source`). Some durable references would be clearer with an embedded image — e.g. the Sourdough Journey V2.0 fermentation chart referenced in FOLD_1, shaping diagrams, scoring patterns, aliquot-jar photos.

Proposal: extend `StateNote` to optionally include an image reference, and update `StateStep.vue` to render the image inline with the note text.

## Success criteria

- Add an optional `image` field (or similar) to the `StateNote` type
- Update `StateStep.vue` to render the image when present
- Add the Sourdough Journey V2.0 fermentation chart image to FOLD_1 on the sourdough recipe as the first use case
- Snapshot test for the new rendering

## Questions to groom

- Image source — remote URL, local `public/images/state-notes/` directory, or both?
- Image sizing — fixed max-width, thumbnail + lightbox, responsive?
- Alt text — required or optional?
- Caption — separate field, or reuse `text`?
- Where does the Sourdough Journey chart live — embed ours under fair-use attribution, or link out only?
- Does this change the StateNote JSON schema in a backwards-compatible way?

This is a draft — needs clarify loop before it becomes a PF- task.
<!-- SECTION:DESCRIPTION:END -->
