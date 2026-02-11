---
id: PF-4.2
title: 'Design: Photo pipeline architecture'
status: Done
assignee: []
created_date: '2026-02-07 04:36'
updated_date: '2026-02-07 05:24'
labels:
  - design
dependencies:
  - PF-4.1
parent_task_id: PF-4
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
High-level design doc for the photo pipeline. Covers directory structure, script CLI interface, recipe JSON schema changes, TypeScript types, .gitignore updates, Vue component approach, and npm script wiring. Based on PF-4.1 spike findings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Directory structure documented (photos-source/ input, public/images/ output)
- [x] #2 Script CLI interface defined (args, flags, dry-run, --all)
- [x] #3 CookLogEntry.photos schema defined (src, alt, caption fields)
- [x] #4 TypeScript interface additions specified
- [x] #5 .gitignore additions specified (photos-source/, *.HEIC, *.heic)
- [x] #6 Vue rendering approach decided (inline in CookLogSection vs separate component)
- [x] #7 npm script entry defined
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Photo Pipeline Architecture — Design Doc

### 1. Directory Structure (AC #1)

```
photos-source/                          # .gitignored — originals (HEIC/JPEG/PNG)
  {recipe-id}/
    {date}/
      IMG_1234.HEIC
      IMG_5678.jpg

public/images/                          # committed — processed WebP output
  {recipe-id}/
    {date}/
      {descriptive-name}-800w.webp      # full (800px wide)
      {descriptive-name}-400w.webp      # thumb (400px wide)
```

Naming: user provides descriptive name at processing time (e.g., `dough-after-first-rise`). Script prompts or accepts via CLI arg.

### 2. Script CLI Interface (AC #2)

File: `scripts/process-photos.ts`

```
# Process a single directory (interactive — prompts for output names)
npx tsx scripts/process-photos.ts photos-source/atk-cinnamon-buns-ultimate/2026-02-07/

# Dry run — show what would be created
npx tsx scripts/process-photos.ts --dry-run photos-source/atk-cinnamon-buns-ultimate/2026-02-07/

# Process all unprocessed source directories
npx tsx scripts/process-photos.ts --all

# Batch mode with name mapping file
npx tsx scripts/process-photos.ts --map names.json photos-source/atk-cinnamon-buns-ultimate/2026-02-07/
```

**Args:**
- Positional: path to source directory (`photos-source/{recipe-id}/{date}/`)
- `--dry-run`: Print actions without writing files
- `--all`: Process all source dirs that have no corresponding output
- `--quality N`: WebP quality (default 80)

**Output sizes:**
- `800w` — 800px wide, proportional height (full-width mobile view)
- `400w` — 400px wide, proportional height (thumbnails, cook log inline)

**Processing steps per image:**
1. Detect format (HEIC → `heic-convert`, else direct to sharp)
2. Auto-rotate (sharp `rotate()`)
3. Resize to 800w and 400w
4. Strip ALL EXIF metadata (sharp default)
5. Encode as WebP quality 80
6. Write to `public/images/{recipe-id}/{date}/`
7. Log extracted `DateTimeOriginal` if present

**Exit codes:** 0 success, 1 error (missing deps, bad path, conversion failure)

### 3. Recipe JSON Schema — CookLogPhoto (AC #3)

```json
{
  "cook_log": [{
    "date": "2026-02-07",
    "version": "1.0",
    "notes": ["First bake with overnight rise"],
    "photos": [
      {
        "src": "/images/atk-cinnamon-buns-ultimate/2026-02-07/dough-after-rise-800w.webp",
        "thumb": "/images/atk-cinnamon-buns-ultimate/2026-02-07/dough-after-rise-400w.webp",
        "alt": "Dough doubled in size after overnight cold rise"
      },
      {
        "src": "/images/atk-cinnamon-buns-ultimate/2026-02-07/finished-buns-800w.webp",
        "thumb": "/images/atk-cinnamon-buns-ultimate/2026-02-07/finished-buns-400w.webp",
        "alt": "Glazed cinnamon buns fresh from the oven"
      }
    ]
  }]
}
```

Fields:
- `src` (required): path to 800w image
- `thumb` (required): path to 400w image
- `alt` (required): accessible description of what the photo shows

No `caption` field in v1 — `alt` serves double duty. Can add later if needed.

### 4. TypeScript Interface Additions (AC #4)

In `src/types/recipe.ts`:

```typescript
export interface CookLogPhoto {
  src: string
  thumb: string
  alt: string
}
```

Update `CookLogEntry`:

```typescript
export interface CookLogEntry {
  date: string
  version: string
  notes: string[]
  step_notes?: Record<string, string>
  next_time?: string[]
  photos?: CookLogPhoto[]   // NEW — optional array of processed photos
}
```

### 5. .gitignore Additions (AC #5)

```gitignore
# Photo pipeline — source originals (large, private EXIF)
photos-source/
*.HEIC
*.heic
```

`public/images/` is NOT ignored — processed WebP files are committed.

### 6. Vue Rendering Approach (AC #6)

**Decision: Inline in CookLogSection.vue** (not a separate component).

Rationale:
- Photos are part of a cook log entry, not standalone
- Simple enough: a flex row of thumbnails that link/expand to full
- No reuse elsewhere in v1
- Keeps component count flat

Rendering plan:
- After the markdown notes `div`, add a photo row if `entry.photos?.length`
- Show `thumb` images in a horizontal flex row with gap
- On click, open `src` (800w) in a simple overlay or new tab (v1: new tab)
- `alt` on each `<img>` for accessibility
- `loading="lazy"` on all images

```html
<!-- Inside CookLogSection.vue, after prose div -->
<div v-if="entry.photos?.length" class="flex flex-wrap gap-2 mt-3">
  <a
    v-for="(photo, i) in entry.photos"
    :key="i"
    :href="photo.src"
    target="_blank"
    class="block"
  >
    <img
      :src="photo.thumb"
      :alt="photo.alt"
      loading="lazy"
      class="h-24 w-auto border-2 border-stone-200"
    />
  </a>
</div>
```

### 7. npm Script Entry (AC #7)

In `package.json`:

```json
"photos": "tsx scripts/process-photos.ts"
```

Usage: `npm run photos -- photos-source/atk-cinnamon-buns-ultimate/2026-02-07/`

### Dependencies

Add to `devDependencies`:
- `sharp` — resize, strip EXIF, WebP encode
- `heic-convert` — decode HEIC/HEIF to raw buffer

### What's NOT in v1

- No lightbox/overlay component (click opens full image in new tab)
- No LQIP blur placeholders
- No responsive `<picture>` / `srcset`
- No build-time processing (manual script only)
- No AI image analysis or auto-tagging
- No `caption` field (alt suffices)
- No step-level photo references (photos attach to cook_log entries only)
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Design doc complete. All 7 ACs covered in implementation plan: directory layout, CLI interface, CookLogPhoto schema (src/thumb/alt), TypeScript types, .gitignore additions, inline rendering in CookLogSection.vue, npm script entry. v1 scope cuts shelved as ungroomed backlog tasks (PF-4.7, PF-53–57).
<!-- SECTION:FINAL_SUMMARY:END -->
