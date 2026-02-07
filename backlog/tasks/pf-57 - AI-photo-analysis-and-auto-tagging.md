---
id: PF-57
title: AI photo analysis and auto-tagging
status: To Do
assignee: []
created_date: '2026-02-07 05:23'
updated_date: '2026-02-07 05:39'
labels:
  - feature
  - ungroomed
dependencies: []
references:
  - ~/.dotfiles/bin/transcribe_youtube
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use AI image analysis to auto-generate alt text, detect bake stage (dough, proofing, baked, glazed), extract color/texture descriptors, and suggest purpose tags for photos.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reference pattern: `~/.dotfiles/bin/transcribe_youtube` uses Claude Haiku vision to describe video screenshots with structured JSON (scene_type, description, visible_text). Same approach could analyze bake photos — detect stage, describe content, suggest alt text. Uses base64-encoded JPEG + transcript context fed to vision API.
<!-- SECTION:NOTES:END -->
