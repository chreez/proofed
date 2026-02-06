# Feature Backlog

Captured during cooking sessions. Implement when ready.

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

## Recipe Families (Option 4)

**Status:** Design selected, not implemented

Link recipe variants in index.json:
```json
{
  "families": [{
    "id": "atk-cinnamon-buns",
    "name": "ATK Cinnamon Buns",
    "variants": [
      { "id": "quick", "label": "Quick (1.5 hrs)" },
      { "id": "overnight", "label": "Overnight" },
      { "id": "ultimate", "label": "Ultimate (5 hrs)" }
    ]
  }]
}
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
