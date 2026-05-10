---
name: bake-stats
description: Use when user wants a snapshot of all bakes, recipe statistics, cost summaries, or baking activity overview
user-invocable: true
allowed-tools: Bash, Read
model: haiku
argument-hint: "[--stdout] [--no-clipboard]"
---

# Bake Stats Snapshot

Generate a JSON snapshot of all bake activity across recipes. Reads every recipe's `cook_log`, compiles per-recipe and global stats, saves to `data/snapshots/`, and copies to clipboard.

## Usage

```
/bake-stats                    # Save to file + clipboard (default)
/bake-stats --stdout           # JSON to stdout only
/bake-stats --no-clipboard     # File only, skip clipboard
```

## What It Does

Run the script:

```bash
npx tsx scripts/bake-stats.ts
```

Script handles everything: reads recipes, compiles stats, writes file, copies clipboard. No agent math needed.

## Output Schema

```json
{
  "snapshot_date": "YYYY-MM-DD",
  "totals": {
    "recipes_in_index": 22,
    "recipes_baked": 12,
    "total_bakes": 35,
    "total_photos": 150,
    "date_range": { "first": "...", "last": "..." },
    "cost": { "total_spent": 45.23, "bakes_with_cost": 8, "avg_per_bake": 5.65 }
  },
  "by_group": { "Sourdough Breads": { "recipes": 5, "recipes_baked": 4, "bakes": 15 } },
  "recipes": [
    {
      "id": "...", "name": "...", "group": "...", "subgroup": null,
      "current_version": "v1.3.0", "bake_count": 5, "excluded_bakes": 0,
      "first_bake": "...", "last_bake": "...",
      "total_photos": 23, "versions_used": ["v1.0.0"],
      "next_time_count": 8, "aberrations": 0, "has_bake_stats": true,
      "cost": { "avg_per_bake": 12.50, "avg_per_serving": 1.56, "bakes_with_cost": 3, "total_spent": 37.50 }
    }
  ]
}
```

## Stats-Excluded Entries (PF-240)

Cook log entries with `excludeFromStats: true` (or recipes whose
`config.excludeFromStatsDefault: true` applies) are **removed** from every
rolled-up count: `bake_count`, `total_bakes`, `by_group.*.bakes`,
`recipes_baked` (when zero countable bakes remain), photos, cost totals,
date_range, and `versions_used`.

The chosen approach is **omit-and-surface**: excluded entries do not inflate
headline numbers, but the per-recipe `excluded_bakes` field reports the count
so the snapshot remains a complete picture of what's in the cook log. Use
`excluded_bakes` to spot recipes where exclusion is in play (e.g., one-off
experimental bakes) without polluting the comparable stats.

In-progress entries (`status: "in_progress"`) are also excluded from the
rollups via the same filter; they are not yet completed bakes.

## File Location

Snapshots save to `data/snapshots/YYYY-MM-DD.json`. Directory auto-created on first run. Not in `public/` — these are documentation artifacts, not site content.

## After Running

Print the summary line the script outputs to stderr. If user wants details, read the snapshot file or the clipboard content.
