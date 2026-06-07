# Mise Container Sheet — Demo Spec

**Status:** Draft / exploratory
**Author:** Chris (during pastry trial at the bakery)
**Date:** 2026-06-06
**Audience:** Future agent session in `~/workspace/proofed/`. Self-contained — do not assume the originating chat is available.

---

## Origin

This spec came out of trial notes at a working bakery. The owner's line is *"Do something about it, don't complain."* The author's trial tenure is being treated as a window to record process friction that the next new hire shouldn't have to discover on their own. This is the first artifact of that effort.

Personal note that seeded it: while mise-ing for recipes, it was hard to gauge **how many containers** to grab, and **how many of each ingredient bar/jug** would be needed (yeast bars, butter bars, milk jugs, cambros of various sizes). Existing recipes don't communicate that.

---

## Purpose

Produce a **paper-friendly mise-en-place container sheet**: a generic one-pager a new pastry hand fills in by pen for each recipe. It answers, before the cook leaves the dry/wet station, *what containers do I need to pull and how many of each thing do I scale into them?*

Three payoffs:
1. **Speed up onboarding.** New hires don't have to learn container sizing by trial and error.
2. **Reduce trips back to the walk-in.** Better pre-flight = fewer mid-recipe scrambles.
3. **Scavenger-hunt framing.** The sheet doubles as a self-guided tour. Instead of the instructor narrating where everything lives, the newcomer hunts each container and ingredient down. Side effect: forces conversation with other staff, which is how kitchen norms actually get learned. Trainer time is preserved for real exceptions.

Long-term, the same data model could feed a print-on-demand sheet *per recipe* once the recipe JSON in `public/recipes/` carries container metadata. The demo deliberately stops short of that — it's a pen-and-paper prototype to validate the form first.

---

## Deliverable for the demo

A single route in this Vite/Vue app that renders a **printable one-page sheet** containing:

### 1. Title
At the top of the page: a clear printed title — something like **"Mise-en-Place Container Sheet"**. This is a generic sheet, not recipe-specific, so the title should reflect that.

### 2. Pen-input header
Underneath the title, two pre-printed labels with **blank lines for handwritten input**:

- **Recipe:** `_____________________________________________`
- **Scale:**  `[ ] x1   [ ] x2   [ ] x4   [ ] x8   [ ] x____`  (checkboxes for the common multipliers + a fill-in box for arbitrary scaling)

No date/initials field required for this demo (can be added later if useful).

### 3. Container grid — 5 sample cambros
A grid/table with **5 rows**, one per container slot. For the demo, all 5 are **cambros of different sizes** (placeholder images are fine — clearly marked as mocks). Each row has:

- A small **placeholder image** of the cambro (different size silhouette per row).
- A **label** with the size (e.g. 2 qt, 4 qt, 6 qt, 12 qt, 22 qt — use whatever 5 distinct sizes look reasonable; will be corrected once Chef Kate confirms taxonomy).
- **Pen-fill columns** (see "Attributes per row" below).

### 4. Sample ingredient placeholders
Pre-print 2–3 sample ingredient rows above or alongside the container grid so the format is obvious to first-time users. Use **dumb placeholders** — these aren't meant to be authoritative.

- **Butter blocks** — brand TBD, estimated weight per package **~425 g**. Including the per-package weight is the point: it lets the baker do the math (`needed grams ÷ package grams = packages to grab`).
- **Placeholder ingredient B** — e.g. "Flour bag" with a dummy "~2270 g per bag" weight.
- **Placeholder ingredient C** — e.g. "Milk jug" with a dummy "~3785 g per gallon" weight.

The exact placeholder numbers don't matter; they exist to demonstrate the "weight per package" column and how it helps with quantity calculations.

### 5. Pull list footer
A short checklist section at the bottom — running tally of containers + ingredient packages needed for the run. Blank checkboxes next to each line.

### Print + tech notes
- Route can live at `/mise-sheet`.
- Print cleanly: no nav chrome, no overflow, fits one page (Letter by default).
- UnoCSS in line with the existing warm stone palette.
- Throwaway demo — no JSON contract changes, no recipe integration, no tests.

---

## Container inventory (context — demo uses cambros only)

For the demo, **stick to 5 cambros of different sizes** with placeholder images. The broader inventory below is just context for follow-up passes.

Names the author knows (out of scope for this demo, in scope for v1):

- **Cambros** — multiple sizes. Demo uses these. Size taxonomy (quart? 2-qt? 6-qt? 22-qt?) still needs confirmation from Chef Kate.
- **Yeast bar** — rectangular bar/container used for portioned yeast.
- **Butter bar** — same form factor, used for butter portions.
- **Milk jug** — for liquid dairy.

Names the author **doesn't know yet** (defer to v1):
There are other small containers in regular use whose names the author hasn't learned. Capture them in a v1 pass with real photos + correct names.

**Image strategy:**
- v0 (this demo): hand-mocked SVGs or simple CSS shapes are fine — clearly badged as "mock". Don't burn time sourcing photos.
- v1 (follow-up, not in scope): photograph the actual containers in the bakery in their natural lighting; swap mock images for real ones at the same slot positions.

---

## Attributes per row (the pen-fill columns)

The whole point of pen-filling is that the form scales to any recipe. Each row in the grid should leave space for:

| Column | Width hint | Notes |
|--------|------------|-------|
| Container icon + label | small | Pre-printed |
| How many of this container | small | Pen — e.g. "2" |
| Ingredient | medium | Pen |
| Target weight (g) | small | Pen — recipe is grams-only (see CLAUDE.md) |
| Weight per package (g) | small | Pen — e.g. "425" for a butter block. Lets the baker do `target ÷ per-package = packages to grab` without leaving the station. |
| Packages to grab | small | Pen — the calculation result |
| Notes | medium | Pen — "pre-portioned night before", "cold", etc. |

Keep the rows readable on a single printed page. The sample ingredient rows (butter blocks ~425 g, etc.) demonstrate how the "weight per package" column is meant to be used.

---

## Out of scope (do not do in the demo)

- Wiring container metadata into `public/recipes/*.json`.
- Auto-generating a recipe-specific sheet from a chosen recipe.
- Real photographs of bakery containers.
- Backlog task creation (this is a docs/scratchpad exploration, not a `pf-XX` task yet).
- Snapshot tests / coverage gates — demo route can sit outside the tested component set.

If the agent thinks one of those *should* be in scope, surface the question to the user before doing it.

---

## Open questions (resolve with user before claiming "done")

1. **Container taxonomy** — confirm cambro sizes carried at the bakery. If unknown, ship the demo with placeholders + a note to confirm with Chef Kate.
2. **"Mise tote" question** — the author wondered why staff don't carry a big container to ferry mise back and forth from the walk-in. Should the sheet *prompt* for this (a "tote: yes/no" field) or is that a separate process suggestion to log elsewhere?
3. **Per-recipe vs universal** — confirmed universal for the demo. Flag if the design naturally wants to go per-recipe sooner.
4. **Print size** — A4 vs US Letter. Bakery is in the US; default to Letter unless the user says otherwise.

---

## Acceptance criteria (for the next agent session)

- [ ] New route exists and renders a single-page printable mise sheet.
- [ ] Page has a printed **title** at the top (e.g. "Mise-en-Place Container Sheet").
- [ ] Pen-input **header** present: blank line for *Recipe*, checkbox row for *Scale* (`x1, x2, x4, x8, x__`).
- [ ] **5 cambro container rows** with mock placeholder images of different sizes, each labeled with a size.
- [ ] **2–3 sample ingredient rows** pre-printed with dumb placeholder names + estimated weight per package (must include butter blocks at ~425 g as one of them).
- [ ] Pen-fill columns include both **target weight** and **weight per package** so the baker can compute packages-to-grab.
- [ ] **Pull list footer** with blank checkboxes for tallying containers + packages.
- [ ] `window.print()` produces a clean one-page sheet (no nav, no overflow). Letter by default.
- [ ] All weights are in **grams** (per recipe JSON contract in CLAUDE.md).
- [ ] Mock images clearly badged as "mock" so they don't get mistaken for final art.
- [ ] No changes to recipe JSON schema, no new tests, no edits to `public/recipes/`.
- [ ] Demo is reachable from the dev server LAN URL so the user can preview on iPhone before sign-off (per the Human-in-the-Loop Gate in CLAUDE.md — this is a visual task).
- [ ] Before/after presentation given to user; no autonomous commit.

---

## Suggested next steps after demo sign-off

Not part of the demo, but worth recording so they don't get lost:

1. Photograph real containers; swap mock images.
2. Get the cambro/container name taxonomy from Chef Kate.
3. Decide whether container metadata should join the recipe JSON contract (would enable per-recipe auto-generated sheets).
4. Revisit the "mise tote" idea as a separate process-improvement note.
