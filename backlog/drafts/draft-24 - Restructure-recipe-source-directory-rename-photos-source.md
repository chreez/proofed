---
id: DRAFT-24
title: Restructure recipe source directory (rename photos-source)
status: Draft
assignee: []
created_date: '2026-02-24 01:52'
labels:
  - chore
  - dx
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`photos-source/` has become a catch-all for three distinct content types that share nothing but a recipe ID:

1. **Raw bake photos** — HEIC/JPG files, input to the photo processing pipeline (`npm run photos`)
2. **Original source material** — book page scans, video transcripts, screenshots used to create the recipe
3. **Research synthesis** — markdown files output by the `/research` skill

The name `photos-source` only describes #1. Research synthesis docs and recipe source material have no business living under a directory called "photos."

### Scope
- Rename/restructure the top-level directory to something that properly represents all content types (e.g., `recipe-sources/` with clear subdirectories, or split into separate top-level dirs)
- Update all references: CLAUDE.md, checklist.md, photo pipeline scripts, `/research` skill, `/create-recipe` skill, `/bake-log` skill
- Migrate existing files
- Ensure `npm run photos` still works with new paths
- Ensure `.gitignore` rules still apply correctly

### Current structure
```
photos-source/{recipe-id}/
├── {date}/          # raw bake photos (HEIC, JPG)
├── source/          # original recipe material (scans, transcripts)
└── research/        # research synthesis markdown
```

### Why it matters
Agents and humans both get confused about where to put new content. The name actively misleads about the directory's purpose.
<!-- SECTION:DESCRIPTION:END -->
