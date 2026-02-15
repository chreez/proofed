---
id: PF-133
title: Bake scratchpad - structured note capture during bake
status: Done
assignee: []
created_date: '2026-02-13 18:44'
updated_date: '2026-02-15 00:18'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Structured note-taking and reminder system during active bakes. Two related features in one cohesive UI:

**Reminders:** Per-step prompts set during recipe generation (e.g. "measure yield", "check steel temp"). Reminder icon appears when a step is completed — nudges the baker to capture data.

**Notes:** Freeform + prompted note capture at any point during the bake. Popover with contextual questions. Can be triggered per-step or from a floating notepad button.

**Output:** Structured JSON blob for agentic ingestion during `/feedback` session. Data shape supports input/output/result tracking — excel-style exportable for recipe improvement over time.

**Broader direction:** Redesign of how bake log data is captured. Moving from post-hoc recall to in-the-moment structured capture. Feeds back into recipe refinement loop.

**Design open questions (see demo spike):**
- Where does the note UI live? (FAB toolbar vs inline per-step vs hybrid)
- Reminder UX (icon on completed step vs floating banner vs both)
- Structured data shape (what fields, how prompted)
- How it connects to existing feedback/cook log flow
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Per-step reminder icons appear on completed steps when reminders are configured
- [x] #2 Reminders are defined per-step during recipe generation
- [x] #3 Note capture popover with prompted questions is accessible from each step
- [x] #4 Floating notepad button available for general bake notes
- [x] #5 Output is structured JSON blob consumable by /feedback skill
- [x] #6 Data shape supports input/output/result tracking per step
- [x] #7 UI does not clutter the bake view — minimal unless interacted with
- [x] #8 JSON export available for external use (excel-style)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Design Direction (from PF-133.1 demo review)\n\n- **Placement: Inline per-step** — small icon button next to each step title\n- **Reminder UX: Banner** — but must fire BEFORE/DURING the step, not after completion. Key insight: if reminder only fires on step completion, user has already mentally moved past it.\n- **Data capture: Structured form** with prompted questions + freeform\n- **JSON shape: TBD** — step-keyed objects likely best fit

## Implementation Complete (2026-02-14)

### New Files
- `src/composables/useScratchpad.ts` — state management, localStorage persistence
- `src/components/ReminderBanner.vue` — banner above active steps with reminders
- `src/components/ScratchpadNote.vue` — inline icon + popover for per-step notes
- `src/components/GeneralNotesFab.vue` — FAB bottom-left for session-wide notes

### Modified Files
- `src/types/recipe.ts` — StepReminder, ScratchpadEntry, BakeScratchpad types
- `src/components/StateStep.vue` — integrated scratchpad + reminder props
- `src/components/StageCard.vue` — passes scratchpad + activeStepId
- `src/App.vue` — initializes scratchpad, wires events
- `public/recipes/atk-cinnamon-buns-ultimate.json` — sample reminders on 3 steps
- Tests: 30 new tests (684 total), snapshot updated

### Key Decisions
- shallowRef for scratchpad in App.vue (avoids deep reactive unwrapping)
- Explicit save() calls instead of watchers (prevents recursive updates)
- Record<string, boolean> for dismissedReminders (better reactivity than Set)

Build passes. Awaiting HITL visual review.

## PF-133.2 Spike Findings: Desktop Notes Sidebar

**Recommendation: Tabbed sidebar (single right sidebar with Notes/TOC toggle)**

Three layout options were evaluated:
1. **Dual sidebars (left notes + right TOC)** — fails at md breakpoint, content drops to 368px (below 480px minimum)
2. **Tabbed sidebar** — zero content width impact, reuses existing 160px TocSidebar footprint, lowest implementation complexity
3. **Collapsible left panel** — marginal at md breakpoint when collapsed (496px), fails when expanded (268px)

The tabbed sidebar wins because it works at all breakpoints without layout changes, builds on TocSidebar's existing visual language, and follows the project's minimal-UI philosophy.

**Step-note integration**: Keep per-step StickyNote icons as indicators (badge count, accent color). Clicking an icon scrolls the sidebar to that step's notes section and switches to the Notes tab if needed. Eliminates the popover — all editing happens in the sidebar panel. This preserves the spatial awareness chosen in PF-133.1 while centralizing the editing surface.

**Mobile**: No changes. Sidebar hidden below md breakpoint, existing FAB patterns (notes bottom-left, TOC bottom-right) unchanged.

**Width concern**: 160px is tight for note content (textarea, ratings). May want to allow sidebar to grow to 200px for the Notes tab, or use a more compact note input design. Worth exploring in the implementation task.

Full findings documented in PF-133.2 implementation notes.

## PF-133.3 Spike Findings: Single-Active-Dialog Architecture

### Overlay Inventory
6 overlay participants identified on recipe page:
- **ScratchpadNote** (z-30, inline popover, local isOpen ref, 10-20+ instances)
- **GeneralNotesFab** (z-40/50, FAB + teleported panel, local isOpen ref)
- **TocSidebar mobile** (z-40/50, FAB + teleported bottom sheet, local isSheetOpen ref)
- **PhotoLightbox** (z-100, full-screen, prop-driven open state)
- **ShareModal** (z-50, true modal, exposed open() method)
- **TocSidebar desktop** (no z-index, always-visible sticky sidebar)

### Recommended Approach
**New `useActiveDialog` composable** with module-level singleton `ref<string | null>`. Each participant imports it directly — zero prop drilling.

- Follows existing singleton pattern from `useScratchpad.ts`
- Works at any component depth (ScratchpadNote is 3 levels deep)
- Single reactive write auto-closes previous dialog via computed
- Clean Esc handling: each component calls `close(myId)`

### Participation Boundary
- **PARTICIPATES**: ScratchpadNote, GeneralNotesFab (same workflow, competing for attention)
- **INDEPENDENT**: TocSidebar (both desktop/mobile), PhotoLightbox, ShareModal (different purpose/context, higher z-layers)

### Implementation Scope
- 1 new file: `useActiveDialog.ts` (~25 lines)
- 2 modified files: ScratchpadNote.vue, GeneralNotesFab.vue
- Replace local `isOpen` refs with computed off shared `activeId`

### Bonus: Missing Esc handlers found on GeneralNotesFab and TocSidebar mobile sheet

## PF-133.4 Spike Findings: Bake Session Lifecycle

**Core recommendation:** Explicit "Start Bake" button in RecipeMeta header with auto-resume on page reload.

**Trigger:** "Start Bake" button in RecipeMeta.vue replaces current always-on scratchpad. Clean intent signal.

**Lifecycle:** Browse mode (default, scratchpad hidden) → Start Bake (scratchpad UI appears) → End Bake (prompt to export notes, return to browse mode).

**Persistence:** New `useBakeSession` composable with `bake-session-{recipeId}` localStorage key. Stores `{ active, startedAt, recipeId, version }`. Independent from existing `recipe-progress-{id}` and `scratchpad-{id}` keys.

**Resume:** Banner prompt on page reload when active session exists: "Bake in progress — Resume?" with stale detection (>24h shows context).

**Shared mode:** No impact. Shared viewers land on bake-detail route (`/recipe/:id/bake/:date?shared=true`) which is a completely separate read-only view. Bake session only applies to the recipe page.

**UI surface gated by bake mode:** ScratchpadNote icons (StateStep.vue), ReminderBanner (StateStep.vue), GeneralNotesFab (App.vue), quick rating buttons (ScratchpadNote.vue). All currently gated by `v-if="scratchpad"` — setting `scratchpad.value = null` when bake inactive hides everything with no component changes.

**New files needed:** `src/composables/useBakeSession.ts`, `src/components/BakeResumeBanner.vue`
**Modified files:** `RecipeMeta.vue` (Start/End Bake buttons), `App.vue` (wire session composable, gate scratchpad)
<!-- SECTION:NOTES:END -->
