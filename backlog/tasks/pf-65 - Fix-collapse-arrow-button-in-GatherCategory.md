---
id: PF-65
title: Fix collapse arrow button in GatherCategory
status: Done
assignee: []
created_date: '2026-02-07 11:39'
updated_date: '2026-02-07 11:41'
labels:
  - bug (styling)
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The ▲ button next to "Clear All" in GatherCategory appears non-functional when tapped. The interaction flow it enables is valuable: (1) all items checked → auto-collapse, (2) tap badge to peek → re-expands, (3) tap ▲ to put away again. This avoids needing to uncheck/recheck to collapse. Fix the button and make it feel intentional rather than like a relic.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ▲ button successfully re-collapses a manually-expanded completed section
- [x] #2 Button has adequate touch target (min 44x44px) for mobile
- [x] #3 Visual treatment feels intentional — consistent with existing UI patterns
- [x] #4 Existing collapse/expand behavior unchanged (auto-collapse on all checked, badge to re-expand)
- [x] #5 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Investigation Notes\n\nThe collapse() function (line 82-84) sets `manuallyExpanded = false`, which should trigger `isCollapsed = true` via the computed. Logic looks correct on paper — likely a click propagation or reactivity issue. Need to test in browser devtools.\n\n## Demo Considerations\n\n**Current UX problem:** The ▲ is a plain text character in a tiny button with minimal hit target. It looks accidental, not designed. Even if the click handler works, users won't trust it.\n\n**Potential improvements:**\n- Use an IconButton (already exists in codebase) for consistent styling and hit target\n- Animate the collapse transition so the ▲ tap feels responsive\n- Consider swapping label from \"Clear All\" to \"Collapse\" when manuallyExpanded, so the two actions (clear vs collapse) aren't ambiguous side-by-side\n- Or: make the entire header row tappable to collapse (like the expand click on the badge row), ditch the standalone button entirely\n\n**Simplest fix:** Debug why the click doesn't fire (event propagation? touch target?), then increase button size/padding for mobile."
<!-- SECTION:NOTES:END -->
