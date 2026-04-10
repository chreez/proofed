---
id: PF-194
title: 'Spike: scratchpad note save UX — eliminate scroll-to-save on mobile'
status: To Do
assignee: []
created_date: '2026-04-09 19:28'
updated_date: '2026-04-10 17:01'
labels:
  - spike
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On mobile, after tapping the textarea in ScratchpadNote with existing entries visible, the Save button is below the fold. User must dismiss keyboard, scroll down, then tap Save. High friction for a tool meant for quick notes with messy hands during baking. Research and demo better patterns: (A) auto-save on blur — no button needed, (B) sticky save pinned above keyboard, (C) save action in sheet header/toolbar, (D) submit on Enter for short notes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Research ≥3 UX patterns for eliminating scroll-to-save friction (auto-save on blur, sticky save above keyboard, save in header, submit on Enter).
- [x] #2 Document pros/cons of each pattern against the scratchpad use case (quick notes, messy hands, mobile-primary).
- [ ] #3 Demo subtask: create side-by-side mockup at mobile width (375px) showing top 2-3 options in ScratchpadNote context.
- [x] #4 Evaluate interaction with PF-192 (flat chronological FAB) — does the chosen pattern affect how notes render in the FAB view?
- [x] #5 Document findings on the task.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Spike Findings: Scratchpad Save UX

### Problem Analysis

In `ScratchpadNote.vue`, mobile renders via `BottomSheet` (max-height 70dvh). Content order: existing entries -> reminders -> textarea -> Save button. When the soft keyboard opens after tapping the textarea, the Save button scrolls below the fold. User must dismiss keyboard, scroll down, then tap Save.

**Mitigating factor already in code:** `handleNoteKeydown` (line 41-46) already fires save on Enter (non-shift). Mobile template (line 257) shows hint text "enter to save". However: (1) users may not discover this, (2) tapping Enter on a phone keyboard with floury hands is still a reach, (3) the visible Save button being invisible creates a broken-feeling UI.

### Patterns Evaluated

#### Pattern A: Auto-save on blur (Apple Notes style)
Save fires automatically when textarea loses focus. No Save button needed. Visual confirmation via brief toast or subtle flash.
- **Pros:** Zero-button UX, familiar pattern (Apple Notes, Google Keep), simplest implementation (`@blur="handleSaveNote"`), works with messy-hands use case, drag-to-dismiss triggers blur = auto-saves before closing
- **Cons:** Accidental saves of partial text (mitigated: already guards against empty), no explicit "I meant to save" moment, tapping a reminder input mid-thought triggers save
- **Complexity:** Very low
- **Brand fit:** Good. Less chrome, hint text changes to "tap outside to save"

#### Pattern B: Sticky Save pinned above keyboard (fixed positioning)
Save button uses `position: fixed` + `visualViewport` API to float above the virtual keyboard.
- **Pros:** Save button always visible, explicit save action preserved
- **Cons:** `visualViewport` behavior varies across iOS Safari versions, iOS Safari treats `position: fixed` inside transformed elements (BottomSheet drag-to-dismiss translateY) inconsistently, adds significant cross-browser complexity
- **Complexity:** High
- **Brand fit:** Neutral. Floating buttons don't match sharp-border grounded aesthetic.

#### Pattern C: Save action in BottomSheet header/toolbar
Move Save button into the BottomSheet header bar (flex-shrink-0, never scrolls).
- **Pros:** Always visible, no visualViewport hacks, leverages existing BottomSheet structure
- **Cons:** Save button far from textarea (Fitts's Law violation), header gets crowded, feels disconnected
- **Complexity:** Low
- **Brand fit:** Okay but header is for navigation/identity, not content actions.

#### Pattern D: Textarea-adjacent inline save (input group)
Save button inside/adjacent to textarea as a compact input group.
- **Pros:** Save always visible when textarea is visible, tight spatial coupling
- **Cons:** Still scrolls with content -- if entries + keyboard push viewport, button still clips. Changes textarea visual design.
- **Complexity:** Low-medium
- **Brand fit:** Good. Input groups with sharp borders fit the technical aesthetic.

#### Pattern E: Hybrid auto-save on blur + Enter shortcut (RECOMMENDED)
Combine auto-save on blur with existing Enter-to-save. Remove Save button entirely. Add brief visual confirmation (new entry appears with highlight animation).
- **Pros:** Eliminates problem completely (no button = nothing to scroll to), two natural save triggers (Enter + blur), matches quick-note mental model, drag-to-dismiss = auto-save, lowest friction for messy-hands baking, very simple implementation
- **Cons:** No explicit Save affordance for button-expecters, partial note saves if user taps a reminder field mid-thought (mitigated: already guards against empty text)
- **Complexity:** Very low (one line: `@blur="handleSaveNote"`)
- **Brand fit:** Excellent. Less chrome, more function. Monospace hint text fits brand.

### PF-192 Interaction
PF-192 (Done) ships flat chronological view in GeneralNotesFab. Save UX choice does NOT affect the FAB list rendering. However, the chosen pattern should be applied consistently to BOTH ScratchpadNote (per-step) AND GeneralNotesFab (general notes) textareas for UX consistency.

### Recommendation: Pattern E
1. Eliminates the problem rather than working around it
2. Baking context: fewer taps = better with wet/floury hands
3. Already half-implemented: Enter-to-save exists, adding blur is one line
4. Consistent with modern note UX (Apple Notes, Google Keep, Notion)
5. Low risk: handleSaveNote already guards against empty text

**Implementation plan for executor:**
1. Add `@blur="handleSaveNote"` to textarea in ScratchpadNote.vue (both mobile + desktop)
2. Remove Save button + container div
3. Update hint: "enter or tap outside to save" (mobile) / "enter or click outside to save" (desktop)
4. Apply same blur-to-save to GeneralNotesFab.vue for consistency
5. Optional: CSS highlight animation on newly-added entries
6. Test: type note -> tap backdrop -> verify saved + sheet closes
7. Test: type note -> Enter -> verify saved + textarea clears

2026-04-10: User feedback — Pattern E (auto-save on blur) approved for mobile. For desktop, ensure shift+enter / enter behavior is consistent across the app. ScratchpadNote.vue already has this pattern (line 42: Enter to save, shift+enter for newline, with hint at line 180). Check GeneralNotesFab and any other text input components for consistency. The desktop UX should clearly communicate that multiline input is supported via shift+enter.
<!-- SECTION:NOTES:END -->
