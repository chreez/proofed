# Feature Backlog

Captured during cooking sessions. Implement when ready.

---

## ✅ Permalinks / Clean URLs (DONE 2026-02-06)

- Vue Router with history mode
- Routes: `/` (index), `/recipe/:recipeId`
- Netlify `_redirects` SPA fallback
- Example: `/recipe/atk-cinnamon-buns-ultimate`

---

## ✅ Test Suite (DONE 2026-02-05)

- 95.45% line coverage achieved
- 80 tests across composables, components, integration
- Runs as prebuild hook

---

## ✅ Recipe Families (DONE 2026-02-05)

- Implemented in index.json with variants array
- VariantTabs component for switching

---

## Ralph Loop Adaptation

**Status:** Backlogged

**Prerequisite:** Test suite exists (done).

**Structure to add:**
```
.claude/
├── PRD.json              # Stories with passes: boolean
├── LEARNINGS.md          # Append-only discoveries
```

**Tasks:**
1. Implement test suite (PRIORITY)
2. Convert backlog items to atomic PRD stories
3. Add learnings file
4. Define exit signal pattern

---

## UAT Issues (2026-02-05)

**Status:** Most items completed

### ✅ Header on Scroll (DONE 2026-02-06)
- Shows recipe name when scrolled instead of yield
- Smooth crossfade transition

### Table of Contents
- Need TOC for navigating recipe sections
- **Consider existing tooling** — don't reinvent the wheel
- Options: scrollspy libraries, intersection observer patterns

### ✅ Cook Log Formatting (DONE 2026-02-06)
- Renders as proper markdown document
- Removed non-functional step notes link

### ✅ Animation Polish (DONE 2026-02-06)
- CSS grid animations for smooth collapse/expand
- Removed janky max-height transitions

---

## Baking Log (Cross-Recipe Timeline)

**Status:** Major consideration

**Problem:** Current layout assumes single recipe family with variants. User has multiple recipes and bakes to add.

**Concept:** A master timeline view showing all bakes across all recipes
- Chronological view of cooking sessions
- Each entry links to the specific recipe + cook log
- Filter by recipe family, date range
- Shows growth/progression as a baker

**Data model consideration:**
```json
{
  "baking_log": [
    {
      "date": "2026-02-05",
      "recipeId": "atk-cinnamon-buns-ultimate",
      "version": "v1.0.0",
      "outcome": "success",
      "thumbnail": "images/2026-02-05-buns.jpg"
    }
  ]
}
```

**Where does it live?**
- Separate top-level view (not per-recipe)
- Accessible from index page
- Or: dedicated /log route

---

## Cook Log & Notes System

**Status:** Design complete, not implemented

- `cook_log` array in recipe JSON
- Dated entries with free-form notes
- Can reference specific steps or be recipe-level
- Example: "2026-02-05: Used multiple small foil sheets instead of sling. Will make unmolding harder."

---

## Photo Pipeline

**Status:** Concept captured

**Flow:**
1. User provides photo
2. AI agent analyzes image (separate context window)
3. Extract useful EXIF: timestamp, location weather (via API?), camera info
4. Strip sensitive metadata
5. Downscale for web
6. Generate `{filename}.meta.json` with:
   - AI description
   - Extracted metadata
   - Purpose tag (e.g., "step illustration", "final result", "mistake example")
7. Store in `public/images/{recipe-id}/`

**Placement:**
- In cook_log entries
- In recipe steps (e.g., "rolled dough" photo for ROLL_DOUGH step)

---

## Source Tracking & Change Log

**Status:** Concept captured

**Fields to add to recipe JSON:**
```json
{
  "original_source": {
    "name": "America's Test Kitchen",
    "url": "https://...",
    "found_via": "Reddit post by u/redstaplerguy",
    "access": "paywalled"
  },
  "change_log": [
    {
      "date": "2026-02-05",
      "change": "Increased salt from 4.5g to 6g",
      "reasoning": "Original tasted flat, needed more contrast with sweet filling"
    }
  ]
}
```

---

## Recipe Versioning

**Status:** Concept captured

**Format:** `v{major}.{minor}.{patch}` + date

- Major: Significant recipe change (different method)
- Minor: Ingredient adjustment
- Patch: Note/clarification only

Example: "ATK Cinnamon Buns Ultimate v1.2.0 — cooked 2026-02-05"

---

## System Timers

**Status:** Research needed

- Trigger OS-level timers/alarms instead of in-browser
- Options: Web Notifications API, deep links to clock apps, PWA integration

---

## Suggestion Sources

**Status:** Backlogged

**Problem:** When agent suggests improvements (e.g., "use dental floss for cutting"), these should:
1. Be clearly marked as suggestions, not user experience
2. Include source/reference when possible

**Data model:**
```json
{
  "next_time": [
    {
      "suggestion": "Try dental floss for cleaner cuts",
      "source": "ATK technique guide",
      "source_url": "https://..."
    }
  ]
}
```

**Or simpler:** Markdown links in the text itself:
```
"Try [dental floss cutting technique](url) for cleaner cuts"
```

---

## About Page

**Status:** Content captured, not implemented

**Author:** Chris Palmer
**GitHub:** (repo link)
**Instagram:** https://www.instagram.com/rhythm_hawk/

**Site description:**
> proofed. — A personal cooking notebook. Recipes adapted to my kitchen, documented with notes from each cook session.

---

## Guidebook Layout

**Status:** To be designed

- Mock out overall site structure
- Recipe index/browse view
- Individual recipe view
- Cook log timeline?

---

## Nutritional Info

**Status:** Concept captured

**Key questions:**
1. How is it estimated? (show your work)
2. How is it displayed?
3. Normalization: per variant? per version?

**Estimation approach:**
- Store per-ingredient nutrition data in `public/nutrition-db.json`
- Calculate totals from recipe ingredient amounts
- Show calculation breakdown (transparency)

**Data model:**
```json
{
  "nutrition": {
    "per_serving": {
      "calories": 485,
      "fat_g": 22,
      "carbs_g": 65,
      "protein_g": 7,
      "sugar_g": 32,
      "sodium_mg": 380
    },
    "servings": 8,
    "estimation_method": "calculated",
    "sources": ["usda-fdc", "manufacturer-label"],
    "notes": "Glaze adds ~60 cal/serving"
  }
}
```

**Display options:**
- Collapsed by default (badge shows calories only)
- Expand to show full breakdown
- "How calculated" link shows ingredient-by-ingredient math

**Normalization:**
- Store at **variant** level (Quick vs Ultimate have different ingredients)
- Version changes that affect nutrition bump the calculation
- `nutrition.version` field tracks when last recalculated

**Validation:**
- Sum of ingredient calories ≈ total (±5% tolerance for rounding)
- Flag if recipe changes but nutrition not updated

