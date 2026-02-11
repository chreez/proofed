---
id: PF-4.1
title: 'Spike: Research photo pipeline approaches'
status: Done
assignee: []
created_date: '2026-02-07 04:21'
updated_date: '2026-02-07 04:30'
labels:
  - spike
dependencies: []
parent_task_id: PF-4
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Research spike for PF-4 (Photo pipeline). Three parallel research angles:\n\n**A) Tool Survey** — CLI tools & libraries (sharp, imagemagick, libvips, squoosh-cli, vite plugins). Compare speed, HEIC support, brew deps, Node integration.\n\n**B) Architecture Patterns** — How do JAMstack/static site projects handle photo pipelines? GitHub repos, directory conventions, build integration.\n\n**C) Format & Privacy** — HEIC→WebP/AVIF conversion, EXIF stripping, optimization tradeoffs, responsive srcset, target formats for 2026.\n\nOutput: Synthesized recommendation for toolchain, script structure, and directory layout.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Toolchain
- `heic-convert` (pure JS HEIC decoder) + `sharp` (resize, strip EXIF, compress, WebP output)
- Zero system dependencies — just `npm install`

## Output Format
- **WebP only** (96% browser support, fast encode)
- Quality: 80 (sharp default, sweet spot for food photos)
- No AVIF (10x slower encode for ~20% savings — overkill at this scale)
- No JPEG fallback (WebP covers all real users)

## Output Sizes
- `thumb` — 400px wide (index cards, cook log inline)
- `full` — 800px wide (full-width mobile, half-width desktop)

## Directory Layout
```
photos-source/                          # .gitignored — HEIC originals
  {recipe-id}/
    {date}/
      IMG_1234.HEIC

public/images/                          # committed — processed WebP output
  {recipe-id}/
    {date}/
      {descriptive-name}-800w.webp
      {descriptive-name}-400w.webp
```

## Script Design
`scripts/process-photos.ts` — standalone, manual invocation:
```
npx tsx scripts/process-photos.ts photos-source/{recipe-id}/{date}/
npx tsx scripts/process-photos.ts --all
npx tsx scripts/process-photos.ts --dry-run ...
```

Steps: detect HEIC → heic-convert to buffer → sharp auto-rotate → resize → strip all EXIF → write WebP

## EXIF Strategy
- Strip ALL metadata from output (sharp default behavior)
- Extract `DateTimeOriginal` before processing → store in recipe JSON for cook_log
- GPS, device info, thumbnails — all removed

## Recipe JSON Reference
```json
{
  "cook_log": [{
    "date": "2026-02-05",
    "photos": [{
      "src": "/images/{recipe-id}/{date}/{name}-800w.webp",
      "alt": "Description"
    }]
  }]
}
```

## Git Strategy
- No Git LFS (repo stays well under 100MB for years)
- `.gitignore` source HEICs (`photos-source/`, `*.HEIC`, `*.heic`)
- Commit processed WebP directly

## npm Dependencies
`sharp`, `heic-convert`

## What NOT to do
- No Git LFS, no AVIF, no Netlify Image CDN
- No build-time processing, no LQIP/blur placeholders
- No responsive srcset (2 sizes + `loading="lazy"` is sufficient)
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Spike Complete: Photo Pipeline Research

### 3 parallel research agents covered:
1. **Tool Survey** — Compared sharp, ImageMagick, libvips, squoosh-cli, sips, heic-convert, ffmpeg, Pillow, eleventy-img, cwebp/avifenc
2. **Architecture Patterns** — Analyzed Astro, Eleventy, Hugo, Next.js, Gatsby pipelines; GitHub recipe site examples (Nyum, jec.fish); build integration patterns; Git LFS considerations
3. **Format & Privacy** — HEIC conversion reliability, WebP vs AVIF browser support, EXIF privacy risks, responsive image sizing, compression quality benchmarks

### Recommendation
`heic-convert` + `sharp` in a standalone TypeScript script. WebP-only output at 400w/800w. Strip all EXIF, extract dates to JSON. Commit processed images directly (no LFS). Manual invocation via npm script.
<!-- SECTION:FINAL_SUMMARY:END -->
