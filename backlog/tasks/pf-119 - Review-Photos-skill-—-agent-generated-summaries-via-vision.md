---
id: PF-119
title: Review Photos skill — agent-generated summaries via vision
status: Done
assignee: []
created_date: '2026-02-11 19:54'
updated_date: '2026-02-11 20:30'
labels:
  - feature
  - skill
  - photos
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`/review-photos` Claude Code skill that reads processed photos via multimodal vision, generates descriptive summaries with recipe context, writes them to manifest.json, and opens the review page. Agent needs recipe context (stages, ingredients, techniques) to accurately describe what's in each photo. Voicing matters — summaries should match the proofed. tone (technical warmth, first-person bake context).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /review-photos skill exists at .claude/skills/review-photos/SKILL.md and is registered as user-invocable
- [ ] #2 Skill accepts explicit {recipeId} {date} arguments — no auto-detection
- [ ] #3 Skill validates manifest.json exists at public/images/{recipeId}/{date}/manifest.json before proceeding
- [ ] #4 Skill loads recipe JSON (public/recipes/{recipeId}.json) and extracts targeted context: stage names, state descriptions, and matching cook_log entry (notes, step_notes, existing photos)
- [ ] #5 Skill spawns a sub-agent (Task tool) that reads each photo in the manifest via the Read tool (multimodal vision) alongside recipe context
- [ ] #6 Sub-agent generates a short descriptive summary per photo and writes all summaries back to manifest.json summary fields
- [ ] #7 After summaries are written, skill opens the review page URL (/review/photos/{recipeId}/{date}) for user review
- [ ] #8 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Demo Spike Result (PF-119.1)\n\n**Winner:** Targeted context + Neutral descriptive\n\n- **Context level:** Targeted — stage names, state descriptions, matching cook_log entry (notes, step_notes, existing photos)\n- **Voice:** Neutral descriptive — factual, describes what's visible, references recipe stage when identifiable. No personal pronouns, no inferred personal details.\n- **Why:** Safe from Mozzarella Rule violations. User adds personal voice during review. Agent describes what it sees + maps to recipe stages using context.\n\n**Example output:** \"Pressing brown sugar–cinnamon filling into buttered dough by hand, spreading to edges.\""
<!-- SECTION:NOTES:END -->
