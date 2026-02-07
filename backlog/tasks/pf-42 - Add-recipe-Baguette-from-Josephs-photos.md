---
id: PF-42
title: 'Add recipe: Baguette (from Joseph''s photos)'
status: To Do
assignee: []
created_date: '2026-02-07 02:19'
updated_date: '2026-02-07 09:12'
labels:
  - recipe
dependencies:
  - PF-4
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New recipe from photos of a physical recipe (3 images from Joseph's phone). Need to extract text from images, convert to proofed. JSON schema, validate.\n\nThis is also the first test case for a repeatable recipe ingestion pipeline — whatever process we use here should be documented so future recipe-writer agents can follow the same steps.\n\n## Source Material\n- 3 photos from Joseph's phone (need to be saved to repo or scratchpad)\n- Physical recipe text, likely handwritten or printed\n\n## Pipeline Questions (needs spike)\n- OCR tooling: Claude vision (read images directly), Tesseract, Apple Live Text?\n- Where do source images live? public/recipes/sources/? .claude/sources/?\n- Repeatable steps: image → raw text → structured JSON → validation → commit\n- Agent instructions: can a recipe-writer agent be given images + told "follow the pipeline"?
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tartine baguette recipe extracted from 3 source photos into valid recipe JSON
- [ ] #2 Recipe JSON follows full schema: meta, stages, states, vessels, ingredients with gram weights, exit conditions
- [ ] #3 Source photos stored in photos-source/ (or designated reference location) — not displayed on site
- [ ] #4 Recipe added to public/recipes/index.json manifest
- [ ] #5 Recipe page renders correctly on dev server
- [ ] #6 /validate passes — all D-checks, R-checks satisfied
- [ ] #7 No cook_log (recipe not yet baked)
- [ ] #8 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Image Handling
- User drags photos into Claude Code chat (vision reads them directly)
- Source images should be persisted locally (not just ephemeral in chat)
- Images need downscaling for web use
- Agent moves images to a local folder, decides what to do with them
- Depends on PF-4 (photo pipeline) for the architecture of where/how images are stored and served

## Workflow
1. User drops photos into Claude Code
2. Agent reads images, extracts recipe text
3. Agent saves source images to local folder (TBD by PF-4)
4. Agent builds recipe JSON from extracted text
5. Agent runs /validate
6. User reviews, agent commits
<!-- SECTION:NOTES:END -->
