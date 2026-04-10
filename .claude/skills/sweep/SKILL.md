---
name: sweep
description: Periodic backlog audit sweep with interactive HTML report and team dispatch.
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task, AskUserQuestion,
  mcp__backlog__task_list, mcp__backlog__task_view, mcp__backlog__task_edit,
  mcp__backlog__task_search, mcp__backlog__task_create, mcp__backlog__task_archive
model: opus
argument-hint: "[days] e.g. 7 (default: 2)"
---

# Sweep Skill

Periodic backlog audit sweep. Scans recent activity, dispatches specialized agents per tier, generates an interactive HTML report for HITL feedback, then executes approved changes.

## Usage

```
/sweep          # scan last 2 days
/sweep 7        # scan last 7 days
/sweep 14       # scan last 14 days
```

## Phase 1: Scan

Build a flat inventory of recently-touched backlog items.

### Data Collection

1. **Backlog state**: `task_list` — get all tasks with status, priority, labels
2. **Recently modified files**: `find backlog/ -mtime -N` where N = argument (default 2)
3. **Git activity**: `git log --since="{N} days ago" --oneline --all` — commits touching `backlog/`, `src/`, `public/recipes/`
4. **In-progress entries**: Check recipe JSONs for `"status": "in_progress"` cook_log entries
5. **Draft inventory**: List all files in `backlog/drafts/`

### Output

A flat list of items with:
- Task/draft ID
- Title
- Current status
- Last activity date
- Source (backlog, git, recipe JSON)

## Phase 2: Categorize

Group scanned items into 6 tiers:

| Tier | What belongs here |
|------|------------------|
| **cleanup** | Stale In Progress, done-but-unclosed, duplicate drafts, orphaned demo files |
| **data** | Recipe JSON accuracy flags, bake_stats audit findings, cook_log gaps |
| **feature** | Shipped features needing cleanup, demo artifacts, feature tasks with activity |
| **research** | Spike tasks (complete or in-progress), scaling research, technique investigations |
| **ux** | Styling tasks, UX spikes, mobile issues, design decisions pending |
| **blocked** | Tasks with unresolved dependencies, waiting on external input, deferred items |

### User Confirmation

Present a summary table before dispatching:

```
## Sweep Inventory — {N} items across {M} tiers

| Tier     | Count | Items |
|----------|-------|-------|
| cleanup  | 3     | PF-2, PF-96, DRAFT-32 |
| data     | 1     | PF-184 |
| feature  | 2     | PF-196, PF-180 |
| research | 9     | PF-183.1–.6, PF-197.1–.3 |
| ux       | 1     | PF-194 |
| blocked  | 0     | — |

Confirm tiers are correct, or reassign items?
```

Wait for user confirmation before dispatching agents.

## Phase 3: Dispatch

Create a team and spawn agents per non-empty tier. Dispatch in 2 waves to manage context load.

### Team Setup

```
TeamCreate: "sweep-{date}"
```

### Wave 1 (cleanup + data + research)

These tiers are read-heavy, low-risk analysis. Dispatch in parallel.

### Wave 2 (feature + ux + blocked)

These tiers may involve deeper investigation. Dispatch after Wave 1 completes.

### Agent Prompts

Each agent receives:
- The items assigned to its tier with full task details (via `task_view`)
- Instructions to return **structured JSON findings** (not prose)
- Tier-specific checks (see below)

#### cleanup agent

```
Analyze these backlog items for cleanup actions.

For each item, check:
- Git staleness: `git log --oneline --since="14 days ago" -- "backlog/tasks/{id}*"`
- Status accuracy: is the current status correct?
- Duplicate detection: `task_search` with key terms
- Orphaned artifacts: demo files in `public/demo/` for completed tasks

Return JSON:
{
  "tier": "cleanup",
  "findings": [
    {
      "id": "PF-XX",
      "title": "...",
      "current_status": "...",
      "recommendation": "demote|archive|close|merge|keep",
      "reason": "...",
      "merge_target": "PF-YY"  // only if recommendation is "merge"
    }
  ]
}
```

#### data agent

```
Audit recipe data accuracy for flagged items.

For each item, check:
- D1-D6 design spec compliance (units, breakdowns, exit conditions)
- bake_stats accuracy: cross-reference raw_notes against structured stats
- Cook log voice checks: V1-V5 (no inferred details, first-person, etc.)
- Temperature/weight consistency across entries

Return JSON:
{
  "tier": "data",
  "findings": [
    {
      "id": "PF-XX",
      "title": "...",
      "checks_passed": 12,
      "checks_failed": 3,
      "flags": [
        {
          "entry_date": "2026-03-08",
          "field": "bake_phases[0].duration_min",
          "issue": "Says 60 min but raw notes say '30+ min'",
          "severity": "needs_confirmation"
        }
      ]
    }
  ]
}
```

#### research agent

```
Evaluate research spike completeness.

For each spike, check:
- Research notes exist (findings documented)
- Architecture decision recorded (if applicable)
- Follow-up drafts created from findings
- Sources cited

Return JSON:
{
  "tier": "research",
  "findings": [
    {
      "id": "PF-XX.Y",
      "title": "...",
      "parent": "PF-XX",
      "completeness": "complete|partial|empty",
      "has_notes": true,
      "has_decision": true,
      "draft_count": 2,
      "missing": []
    }
  ]
}
```

#### feature agent

```
Review feature tasks with recent activity.

For each item, check:
- Implementation status: code landed? tests pass?
- Demo artifacts: any `public/demo/` files that should be cleaned up?
- Task status accuracy: does backlog status match reality?

Return JSON:
{
  "tier": "feature",
  "findings": [
    {
      "id": "PF-XX",
      "title": "...",
      "status_accurate": true,
      "demo_artifacts": ["public/demo/pf-xx-demo.html"],
      "cleanup_needed": "description of cleanup"
    }
  ]
}
```

#### ux agent

```
Review UX/styling tasks and spikes.

For each item, check:
- Spike findings documented?
- Recommended approach identified?
- Demo page exists for comparison?
- Blocking any downstream work?

Return JSON:
{
  "tier": "ux",
  "findings": [
    {
      "id": "PF-XX",
      "title": "...",
      "spike_status": "complete|in_progress|not_started",
      "recommendation": "description of recommended approach",
      "demo_path": "public/demo/...",
      "blocks": ["PF-YY"]
    }
  ]
}
```

#### blocked agent

```
Analyze blocked tasks and identify unblock paths.

For each item, check:
- What is the blocker? (dependency, external input, decision needed)
- Is the blocker still valid?
- Can the blocker be resolved in this sweep?

Return JSON:
{
  "tier": "blocked",
  "findings": [
    {
      "id": "PF-XX",
      "title": "...",
      "blocker_type": "dependency|external|decision",
      "blocker_detail": "...",
      "unblock_path": "description of how to unblock",
      "can_resolve_now": true
    }
  ]
}
```

### Team Shutdown

After all agents return findings, shut down the team. Team lifetime is bounded to Phase 3 only.

## Phase 4: Report

Generate an interactive HTML report at `public/demo/audit-sweep-report.html`.

### Report Structure

The report is the central HITL artifact. It must be:
- **Brand-consistent**: JetBrains Mono headings, Inter body, stone palette, 0-radius borders, accent color on "proofed." dot
- **Interactive**: Textareas for feedback, Enter-to-advance, sticky copy bar

### HTML Template

Use these exact CSS variables and conventions (matching the proofed. design system):

```css
:root {
  --ink: #1a1816;
  --stone-100: #f5f3ef;
  --stone-200: #e8e4dc;
  --stone-300: #d4cfc4;
  --accent: #a65d45;
  --green: #2d7a3a;
  --amber: #b47a1a;
  --red: #c0392b;
  --blue: #2c6fbb;
  --mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  --sans: 'Inter', -apple-system, sans-serif;
}
```

### Report Sections

1. **Header**: `proofed. Audit Sweep` with date and summary stats
2. **Stats bar**: Colored count tiles (shipped, flagged, spikes, triage) — use `.stat` cards with colored `.stat-num`
3. **Per-tier sections**: Each non-empty tier gets an `<h2>` and cards for each finding
4. **Cards**: `.card` with `.card-id` (mono, accent), `.card-title` (bold), status `.tag`, and `.card-body` (context)
5. **Tags**: Use semantic tag classes — `.tag-shipped`, `.tag-demoted`, `.tag-closed`, `.tag-archived`, `.tag-spike`, `.tag-audit`, `.tag-verified`
6. **Textarea per section**: Feedback input below each tier's cards
7. **Sticky copy bar**: Fixed at bottom with "Copy all feedback" button

### Textarea Behavior

Each tier section includes a `<textarea>` for user feedback:

```html
<div class="feedback-section" data-tier="{tier}">
  <textarea
    class="feedback-textarea"
    data-tier="{tier}"
    placeholder="{tier-specific placeholder}"
    rows="3"
  ></textarea>
</div>
```

**Enter = advance**: Enter in a textarea scrolls to the next section and focuses its textarea. Shift+Enter inserts a newline. This matches the ScratchpadNote pattern (`src/components/ScratchpadNote.vue:42`).

```javascript
document.querySelectorAll('.feedback-textarea').forEach((ta, i, all) => {
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const next = all[i + 1];
      if (next) {
        next.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => next.focus(), 300);
      }
    }
  });
});
```

### Textarea Placeholders

| Tier | Placeholder |
|------|-------------|
| cleanup | `e.g. 'demote PF-96', 'archive DRAFT-32', 'keep PF-2 — will revisit next week'` |
| data | `e.g. 'Mar 8 preheat was actually 45 min', 'leave flagged temps as-is'` |
| feature | `e.g. 'clean up PF-196.1 demo', 'bump PF-XX to high'` |
| research | `e.g. 'scaling findings look solid', 'PF-183.4 needs more research'` |
| ux | `e.g. 'go with Pattern E for PF-194', 'need demo first'` |
| blocked | `e.g. 'unblock by closing PF-YY', 'defer to next month'` |

### Sticky Copy Bar

Fixed bar at the bottom of the page with a "Copy all feedback" button:

```html
<div class="copy-bar">
  <button onclick="copyFeedback()">Copy all feedback</button>
  <span class="copy-status"></span>
</div>
```

### Feedback JSON Shape

The copy button collects all textarea values into a structured JSON payload:

```json
{
  "type": "sweep-feedback",
  "date": "2026-04-10",
  "sections": {
    "cleanup": "user's cleanup feedback text",
    "data": "user's data feedback text",
    "feature": "user's feature feedback text",
    "research": "user's research feedback text",
    "ux": "user's ux feedback text",
    "blocked": "user's blocked feedback text"
  }
}
```

Only include tiers where the user typed something. Empty textareas are omitted.

```javascript
function copyFeedback() {
  const sections = {};
  document.querySelectorAll('.feedback-textarea').forEach(ta => {
    if (ta.value.trim()) {
      sections[ta.dataset.tier] = ta.value.trim();
    }
  });
  const payload = {
    type: 'sweep-feedback',
    date: new Date().toISOString().split('T')[0],
    sections
  };
  navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  document.querySelector('.copy-status').textContent = 'Copied!';
  setTimeout(() => {
    document.querySelector('.copy-status').textContent = '';
  }, 2000);
}
```

### Open Report

After generating the HTML:

1. Detect LAN IP: `ipconfig getifaddr en0`
2. Read the dev server port from Vite output (default 6811)
3. Open in browser: `open http://<LAN_IP>:<PORT>/demo/audit-sweep-report.html`
4. Print iPhone URL for mobile review

## Phase 5: Review Gate

The user reviews the report in their browser:
1. Reads through each tier section
2. Types feedback in textareas (Enter advances to next section)
3. Clicks "Copy all feedback" at the bottom
4. Pastes the JSON back into the conversation

**Wait for the user to paste the feedback JSON.** Do not proceed until received.

### Parse Feedback

When the user pastes the JSON:

1. Validate shape — must have `type: "sweep-feedback"` and `sections` object
2. Extract per-tier feedback strings
3. Acknowledge what was received:

```
## Feedback Received

| Tier     | Feedback |
|----------|----------|
| cleanup  | "demote PF-96, archive DRAFT-32, keep PF-2" |
| data     | "Mar 8 preheat was actually 45 min" |
| feature  | (no feedback) |
| research | "scaling findings look solid" |
| ux       | "go with Pattern E for PF-194" |
| blocked  | (no feedback) |
```

## Phase 6: Plan

Parse the feedback into a concrete execution plan. Present to user before any writes.

### Execution Plan Table

```
## Execution Plan

| # | Action | Target | Detail | Source |
|---|--------|--------|--------|--------|
| 1 | demote | PF-96 | In Progress → To Do | cleanup feedback |
| 2 | archive | DRAFT-32 | Already shipped as PF-175 | cleanup feedback |
| 3 | edit | PF-184 | Fix Mar 8 preheat: 60 → 45 min | data feedback |
| 4 | edit | PF-194 | Note: user chose Pattern E | ux feedback |

Confirm plan before executing?
```

**Gate:** Wait for explicit user confirmation. The feedback JSON is the contract — only act on what the user typed. If feedback is ambiguous, ask for clarification before adding to the plan.

## Phase 7: Execute

Act on the approved plan. Group actions by type for efficiency.

### Action Types

| Action | How |
|--------|-----|
| **demote** | `task_edit` — status To Do |
| **archive** | `task_archive` — remove from active board |
| **close** | `task_edit` — status Done, add closing note |
| **merge** | Combine descriptions into target, archive source |
| **edit** | `task_edit` — update notes/description/priority |
| **recipe fix** | Edit recipe JSON directly, run `npm run build` |
| **create** | `task_create` — new task/draft from feedback |

### Recipe Changes

If any action modifies `public/recipes/*.json`:
1. Make the edit
2. Run `npm run build` — must pass before proceeding
3. If build fails, fix and retry

### Backlog Changes

Use MCP tools (`task_edit`, `task_archive`, `task_create`) for all backlog operations. Never edit task markdown files directly.

## Phase 8: Commit

### Commit Strategy

Stage per-task, commit per logical group:

| Group | Commit message pattern |
|-------|----------------------|
| Backlog triage (demote/archive/close) | `chore(backlog): sweep triage — demote PF-96, archive DRAFT-32` |
| Recipe data fixes | `fix: {description} (PF-XX)` |
| Feature cleanup | `chore: clean up {artifact} (PF-XX)` |
| New tasks/drafts | `chore(backlog): add {IDs} from sweep` |

### Build Gate

`npm run build` must pass before every commit. Stage task files with code changes (CLAUDE.md rule).

### Regenerate Report

After all commits land:

1. Update the HTML report with final statuses (replace `.tag-audit` with `.tag-verified` for resolved items, etc.)
2. Add a completion summary to the report footer
3. Open the updated report in browser
4. Print final summary:

```
## Sweep Complete

| Metric | Count |
|--------|-------|
| Items scanned | XX |
| Actions taken | XX |
| Commits | XX |
| Flags resolved | XX |
| Flags deferred | XX |

Report: public/demo/audit-sweep-report.html
```

## Rules

- **Read-only until Phase 7.** No MCP writes, no file edits until the user approves the execution plan in Phase 6.
- **Feedback JSON is the contract.** Only act on what the user typed. No autonomous archives/deletes without explicit feedback.
- **Team lifetime bounded to Phase 3.** Create team, dispatch agents, collect findings, shutdown. No lingering agents.
- **Agents return JSON, not prose.** Structured findings enable the report generator. If an agent returns unstructured text, parse it into the expected shape.
- **npm run build before every commit.** Non-negotiable.
- **Stage task files with code changes.** Every commit includes both `src/`/`public/` changes and `backlog/tasks/` updates where applicable.
- **Brand consistency.** The HTML report must use the proofed. design system — JetBrains Mono, Inter, stone palette, 0-radius borders, accent dot.
- **No autonomous kills.** Every archive/delete requires explicit user feedback. "No feedback" for a tier means skip it.
- **Draft-by-default.** Any new tasks created during sweep enter as Draft.
- **One report file.** Always write to `public/demo/audit-sweep-report.html`. Overwrite previous reports — they're throwaway artifacts.
