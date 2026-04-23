# Journey Mode — Speedrun Conceptual Translation

Living reference document mapping speedrun terminology to proofed. baking concepts.

## Term Mapping

| Speedrun | proofed. | Definition | Example |
|----------|----------|------------|---------|
| Game | Recipe | The thing being run | `simple-sourdough.json` |
| Category | Variant | Different versions of the same recipe | Quick vs Overnight cinnamon buns |
| Route | Journey | Ordered sequence of checkpoints through a recipe | PREP → MIX → FOLD → BULK → SHAPE → BAKE |
| Run | Bake session | One complete execution of a journey | 2026-04-22 sourdough bake |
| Split | Checkpoint duration | Time spent on one checkpoint | "Mix Dough: 5:23" |
| Segment | Stage duration | Sum of checkpoint splits within a stage | "DOUGH stage: 25:12" |
| PB | Personal Best | Fastest total active time for a recipe | "Best sourdough active: 22 min" |
| Gold split | Gold checkpoint | Fastest individual checkpoint across all runs | "Best FOLD_1: 1:45 (bake #7)" |
| Sum of Best | Theoretical perfect bake | All gold checkpoints combined | "If every split was gold: 19:30" |
| Ghost | Historical comparison | Delta display during active journey | "+0:15 behind PB at this checkpoint" |
| Active time | Hands-on time | Excludes passive waits | Sum of `category: 'active'` splits |
| Reset | Abandon journey | Clear current run, start fresh | Clear journey state, keep scratchpad |

## Key Differences from Gaming

### Passive time is expected
Games count all time. Baking has unavoidable waits — bulk ferment (8-12hr), proofing (30-60min), baking (25-30min). PB and golds only track `active` category checkpoints. Passive checkpoints are recorded but not compared.

### Quality over speed
A faster bake isn't always better. Journey Mode tracks completion quality (did you capture dough temp? did you record aliquot rise?) alongside speed. The points system (P3) rewards data capture completeness.

### Optimization is mise en place
In gaming, optimization means frame-perfect inputs. In baking, optimization means:
- Efficient mise en place (gather before you start)
- Cleaning while waiting (use passive time productively)
- Reducing dead time between active steps
- Consistent technique (shaping gets faster with practice)

Journey Mode surfaces these improvements by tracking active time between checkpoints.

### Multi-run concurrency
A baker might run 2 recipes simultaneously (sourdough bulk + cinnamon bun prep). Each has its own independent journey. Like playing two games at once with separate timers.

## Checkpoint Categories

| Category | Description | Split Tracking | Examples |
|----------|-------------|---------------|----------|
| `active` | Hands-on work | Full PB/gold tracking | Mix, knead, shape, fold, score |
| `passive` | Unavoidable wait | Duration recorded, no target | Bulk ferment, proof, bake, cool |
| `parallel` | Concurrent with another checkpoint | Gate on slowest in group | Bloom yeast (while tangzhong cools) |

## Data Flow

```
Journey checkpoint completed
  → ScratchpadEntry { type: 'checkpoint_complete', timestamp }
  → Smart input readings (optional)
  → ScratchpadEntry { type: 'tool_reading', toolType, value }

Journey ended
  → End-of-journey summary screen
  → Split times derived from checkpoint timestamps
  → Active time = sum(active checkpoint durations)
  → Data flows into bake-log review pipeline
  → cook_log entry created with journey metadata
```

## Why This Matters

Recipe JSON becomes the forcing function. If stages aren't well-defined for split tracking, the recipe needs improvement. Journey Mode is both a gamification feature AND a recipe quality audit tool. A recipe that's hard to track with checkpoints is a recipe that's hard to follow while baking.
