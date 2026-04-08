---
id: DRAFT-42
title: Image support in state notes
status: Draft
assignee: []
created_date: '2026-04-08 17:20'
labels:
  - ungroomed
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
State notes currently only support text and (as of PF-180) structured tables. Some references would be clearer with an embedded image \u2014 e.g. shaping diagrams, scoring patterns, aliquot-jar photos, or home-made diagrams.

## Origin

This draft was spun out of the original DRAFT-35 after that draft pivoted to **table support** in state notes. Image support was deferred because the original first use case (The Sourdough Journey V2.0 fermentation chart) was identified as copyrighted paid content and is being rebuilt as a home-made table instead, not an image.

## Proposal

- Add an optional `image` field to the `StateNote` type alongside `text`, `critical`, `source`, and `table`
- `StateStep.vue` renders the image inline with the note text/table
- Images stored locally under `public/images/state-notes/{recipe-id}/` (no remote URLs)
- Alt text required per project convention (F24)

## Questions to groom

- Image sizing \u2014 fixed max-width, thumbnail + lightbox, responsive?
- Caption \u2014 separate field or reuse `text`?
- First use case \u2014 no concrete one yet; could be a home-made shaping diagram or scoring pattern illustration
- Does an image coexist with a table in the same note?
- How does alt text requirement get enforced?

This is a draft \u2014 needs clarify loop before it becomes a PF- task.
<!-- SECTION:DESCRIPTION:END -->
