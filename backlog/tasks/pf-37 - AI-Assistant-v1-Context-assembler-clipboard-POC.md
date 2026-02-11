---
id: PF-37
title: 'AI Assistant v1: Context assembler + clipboard (POC)'
status: To Do
assignee: []
created_date: '2026-02-07 01:02'
updated_date: '2026-02-10 08:20'
labels:
  - feature
dependencies: []
priority: medium
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
POC for context-aware recipe Q&A. No API integration — just assembles a rich prompt from the clicked element's context and copies to clipboard for pasting into Claude Code.\n\n## Interaction Model\n- Toggle button activates \"Ask Mode\" (e.g. small FAB or header toggle)\n- In Ask Mode: clicks on elements set context instead of normal behavior (no checkbox toggling, no glossary popups)\n- When off: page works normally, zero interference\n- Input area appears when Ask Mode is active\n- Clicking an element fills a context badge (e.g. \"AP Flour · PREP stage\")\n- User types question → assembled prompt → copy to clipboard\n\n## Must coexist with\n- Technique glossary tooltips (existing click behavior)\n- Gather item checkboxes (existing click behavior)\n- TOC navigation (existing click behavior)\n- Netlify deployment (no server-side requirements)\n\nv2 (API chatbot) is a separate future task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ask Mode toggle exists (FAB, header button, or keyboard shortcut)
- [ ] #2 When Ask Mode is OFF, zero changes to existing page behavior
- [ ] #3 When Ask Mode is ON, clicking elements sets context (not normal click action)
- [ ] #4 Context badge shows what was clicked: element type + label + stage
- [ ] #5 Input field appears for typing a question
- [ ] #6 assemblePrompt() builds markdown string: recipe name/version, stage, element, JSON subtree, question
- [ ] #7 Copy to clipboard button copies assembled prompt
- [ ] #8 Visual indicator that Ask Mode is active (highlight, border, badge)
- [ ] #9 Works on mobile (iPhone test via 192.168.1.213:5173)
- [ ] #10 No server-side requirements — pure client-side, Netlify-compatible
- [ ] #11 Human visual sign-off on Ask Mode UI before commit
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Data Layer\n```\nClickContext {\n  element: { type: \"ingredient\" | \"equipment\" | \"vessel\" | \"technique\" | \"state\", id, label }\n  recipe:  { id, name, version }\n  stage:   { id, title }\n  section: relevant JSON subtree (just the stage/ingredient/state, not full recipe)\n}\n```\n\n## Interaction Flow\n1. User clicks InteractiveElement on recipe page\n2. Build ClickContext from element props + recipe JSON\n3. Open ChatPopover anchored to element\n4. User types question\n5. assemblePrompt(clickContext, userQuestion) → markdown string\n\n## POC Output (v1 — no API)\n- Copy to clipboard button\n- User pastes into Claude Code → agent has full context\n\n## Chatbot Output (v2 — with API)\n- POST to Anthropic API (or Netlify function proxy)\n- System prompt = recipe context + voice rules (V1-V4)\n- Response schema: { message, sources?, suggestion? }\n- Render inline in ChatPopover\n- \"Copy as cook note\" → formats for next_time[]\n- Log interaction to localStorage for feedback metrics\n\n## Component Tree\n```\nApp.vue\n  └─ StageCard.vue\n       └─ GatherSection / StateStep\n            └─ InteractiveElement (new — wraps clickable items)\n                 └─ ChatPopover (new — anchored input + response)\n```\n\n## What's Interactive?\n- Ingredients (\"390g All-Purpose Flour\")\n- Equipment (\"33×23cm Baking Pan\")\n- Vessels (\"10-inch Cast Iron Skillet\")\n- Techniques (extend existing glossary tooltips)\n- State headers (\"KNEAD\" → ask about technique)"}
</invoke>
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Additional Example
User mid-bake: "I ran out of AP flour.. can I use any other flour so I don't waste it?"

Agent (primed with recipe context — knows 390g AP flour, hydration ratio, that it's a quick-rise enriched dough):
→ "Bread flour works — higher protein means slightly more gluten, so reduce milk by ~10g. The buns will be a bit chewier but still good. Don't use cake flour — too little protein for this dough."

This interaction auto-generates a next_time entry:
→ "Try: bread flour if out of AP — reduce milk ~10g for higher protein absorption"

Fits existing voice rules (V2/V3): agent suggestions go in next_time with "Try:" prefix, cited as untested idea, not presented as user experience.

## POC Simplification
No AI integration needed for v1. The chat interaction just captures context and outputs a copyable prompt.

Flow:
1. User clicks element (e.g. "33×23cm Baking Pan")
2. Small input appears: "Ask about this..."
3. User types question: "What does this pan look like?"
4. System assembles a context-rich prompt: element metadata + recipe section + user question
5. Copy to clipboard button (or console.log for dev mode)
6. User pastes into Claude Code → agent has full context → creates tasks, notes, suggestions

This means:
- No API key management
- No CORS issues
- No chat UI rendering responses
- No localStorage concerns
- Just a context assembler + clipboard

The value is in the *context assembly* — not the AI call. Claude Code is already the AI workspace.

## Two-Tier AI Model

### Tier 1: In-browser chatbot (real-time, mid-bake)
- Quick answers while cooking
- Primed with recipe context
- Lightweight — doesn't need to be perfect, just helpful in the moment
- "What temp should my milk be?" → "43°C (110°F) — warm to touch, not hot"
- This DOES need API integration (browser → Anthropic API or thin proxy)

### Tier 2: Claude Code (workspace, research)
- Deep research with verifiable sources
- Documents changes properly (backlog tasks, grooming, commits)
- "Research best flour substitutes for AP in enriched dough" → fetches sources, compares options, creates next_time entries with citations
- Already exists — just needs good context assembly from the site

### Key difference
Chatbot answers questions. Claude Code makes decisions and changes.
Chatbot is ephemeral. Claude Code is documented.
Both generate data that improves the site over time.
<!-- SECTION:NOTES:END -->
