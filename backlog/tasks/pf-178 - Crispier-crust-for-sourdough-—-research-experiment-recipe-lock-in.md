---
id: PF-178
title: 'Crispier crust for sourdough — research, experiment, recipe lock-in'
status: In Progress
assignee: []
created_date: '2026-04-08 16:54'
updated_date: '2026-04-11 17:59'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Recurring theme across the sourdough bake log is the desire for a crispier crust. Bake 11 guest feedback explicitly asked for it. Bake 12 discovered higher uncovered temp (450°F) + flipping at 9-min intervals produced the best crust so far. This parent task consolidates the research thread into an end-to-end flow: research → structured experiments → recipe lock-in.

## Known data points

- **Bake 11 (2026-04-01)** — housewarming party, guest feedback: "Someone mentioned wanting a crispier crust."
- **Bake 12 (2026-04-06)** — "Tried keeping uncovered temp higher on first loaf (didn't lower it). Crust came out really good." + "Uncovered bake: 9 min, flip, 9 min, flip, then 4 extra min with tray turned 90°. Came out even." + "Crust came out better than usual from higher uncovered temp + extra time."
- **Current baseline (v3.2.0)** — `BAKE_UNCOVERED` direction is 9 min + flip + 9 min at 425-450°F. This is the control arm.
- **Outstanding hypothesis** — Consider going up to 24 minutes uncovered at a lower temp (420°F?) for next bake to explore the lower-and-longer end of the spectrum.

## Research questions (answered by PF-178.1 spike)

- What's the actual driver of crust crispness — total energy into the crust, final surface moisture, sugar caramelization, starch gelatinization, or a combination?
- Higher temp + shorter vs. lower temp + longer — which produces a crispier crust for this dough (70% hydration, bread flour, 425-500°F range)?
- Does finishing cold (leaving the oven cracked during cooldown) help crust development?
- Does a light second-stage spritz or a splash of water extend the steam phase differently than just the Dutch oven lid?
- What's the role of internal dough temperature in final crust texture?
- How does post-bake handling (rack cooling, oven off with door cracked) affect final crust crispness?

## Hard sources to consult

- The Perfect Loaf — crust development articles
- King Arthur Baking — sourdough crust guides
- The Sourdough Journey — bake chart + crust tips
- r/Sourdough — community experiments

## Phase structure

1. **Research spike (PF-178.1)** — `/research` skill, multi-source synthesis, produces writeup + numbered experiment plan
2. **Experiment bakes (PF-178.2+)** — one subtask per experiment, created from the spike output. Each isolates exactly one variable from the v3.2.0 baseline. At least 3 bakes completed before concluding.
3. **Recipe lock-in** — winning method updates `BAKE_UNCOVERED` direction + state notes in `simple-sourdough.json`, bumps version to v3.3.0.

Parent task completes when the winning method is locked into the recipe and verified via build gate.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Research spike subtask is created as the first subtask and completed before any experiment subtasks are spawned
- [x] #2 Research spike output produces a numbered experiment plan with 3-5 concrete experiments, each isolating one testable variable
- [ ] #3 One subtask per experiment is created from the experiment plan, each with hypothesis, isolated variable, measurement method, and pass/fail criteria
- [ ] #4 At least 3 experiment bakes are completed and logged in `public/recipes/simple-sourdough.json` `cook_log[]` before concluding a winning method
- [ ] #5 Each experiment bake's cook_log entry references its experiment subtask ID in notes
- [ ] #6 A winning method is identified in parent task implementation notes, citing which experiments support the conclusion
- [ ] #7 `BAKE_UNCOVERED` direction in `simple-sourdough.json` is updated to lock in the winning method (temp, time, flip pattern, finish-cold, etc.)
- [ ] #8 At least one `BAKE_UNCOVERED` state note is added or updated with the user-voice learning from the experiment phase
- [ ] #9 Recipe version bumps to v3.3.0 (minor) with a `change_log` entry summarizing the crust experiment findings
- [ ] #10 `npm run build` passes after the recipe update
- [ ] #11 Parent task implementation notes include a results table summarizing each experiment bake (hypothesis, result, win/loss)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## PF-178.1 Spike Findings: Crust Crispness Research Synthesis (2026-04-08)

Multi-source synthesis answering the 6 research questions from PF-178. Research conducted via parallel web research across The Perfect Loaf, King Arthur Baking, The Sourdough Journey, The Fresh Loaf (r/Sourdough adjacent), Sourdoughlogy, and Bakery Industry Insider.

### Q1: What drives crust crispness?

**Answer:** Crust crispness is a composite of three physical/chemical drivers, with **surface moisture loss** being the dominant controllable variable.

- **Maillard reaction** starts at ~115°C (239°F) — protein + reducing sugar browning. Produces color, flavor, and the hard outer shell. (KAB, Sourdoughlogy, Bakery Industry Insider)
- **Caramelization** intensifies around ~160°C (320°F) — direct sugar browning. Adds color depth and bitter/toffee notes. (KAB, TPL)
- **Surface moisture loss** — water must escape the crust for it to harden. Once starches gelatinize from steam, the crust sets; then drying governs crispness. (TPL, KAB, The Sourdough Journey)

**Confidence: HIGH** — all 4 hard sources agree. The actionable lever is "how much water is still in the crust when you pull the loaf," not absolute temperature.

**Citations:**
- [King Arthur: Maillard reaction in baking](https://www.kingarthurbaking.com/blog/2022/02/15/understanding-the-maillard-reaction-in-baking)
- [Bakery Industry Insider: The Mechanics of Bread Crusts](https://bakeryinsider.com/p/the-mechanics-of-bread-crusts)
- [Sourdoughlogy: Secret to crisp sourdough crust](https://sourdoughlogy.com/the-secret-to-getting-a-perfectly-crisp-sourdough-crust-every-time)

### Q2: Higher temp + shorter vs. lower temp + longer?

**Answer:** For a **thinner, crispier crust**, the consensus is **higher temp + shorter uncovered time**. For a **thicker, crunchier crust**, lower temp + longer uncovered time. Both produce "crispy" but with different textures.

- The Perfect Loaf explicit: "If you regularly bake at 450°F for 50 minutes but your crust is thick and hard, try baking at 475°F for 30 minutes" → thinner crust, easier to cut, still crisp.
- The Sourdough Journey (Tom Cucuzza experiments): 500°F preheat → 450°F covered 20 min → 450°F uncovered 20 min is the canonical curve. Also showed 400°F for 80 min works but produces a different (thicker) crust.
- The Fresh Loaf community: "Time cooks, temperature gives colour" — higher temp = faster browning and shell set, less time for moisture to re-migrate inward.
- Counterpoint: Too hot (above ~500°F) can "set up the crust before the loaf fully springs," capping oven spring. There's a ceiling.

**For 70% hydration bread flour boule in a Dutch oven, the sweet spot is the 450-475°F uncovered range.** Our current v3.2.0 baseline of 425-450°F sits at the LOW end of what's recommended; moving the uncovered phase up to 475°F is a high-confidence improvement direction.

**Confidence: HIGH** — TPL and The Sourdough Journey concur; r/Sourdough / Fresh Loaf threads echo this repeatedly.

**Citations:**
- [The Perfect Loaf: How to bake sourdough with a thin crust](https://www.theperfectloaf.com/how-to-bake-sourdough-bread-with-a-thin-crust/)
- [The Sourdough Journey: Secrets of baking temperature and oven spring](https://thesourdoughjourney.com/the-secrets-of-baking-temperature-and-ovenspring/)
- [Fresh Loaf: 475F vs 450F discussion](https://www.thefreshloaf.com/node/64749/oven-temperature-again)

### Q3: Does finish-cold (oven off, door cracked) help?

**Answer:** **Yes — medium-to-high confidence.** Multiple sources endorse "let it cool in the turned-off, cracked oven" as a crust preservation technique specifically for crusty breads.

Mechanism (King Arthur): "As the bread cools, any leftover moisture in its interior migrates to the surface. If that moisture reaches the surface and hits cool air—typical room temperature—it condenses on the outer crust, making it soggy. If it hits warm air (your still-warm oven), it evaporates—leaving the crust crisp."

- King Arthur — turn oven off, transfer loaf to middle rack, crack door (folded potholder), let cool in oven
- Fresh Loaf threads — "crispy crust softens on cooling" problem explicitly solved by this method
- Practical concern: kitchen humidity matters. In dry rooms the effect is subtle; in humid rooms the effect is significant.

**Confidence: MEDIUM-HIGH** — KAB is authoritative, forums corroborate. No source contradicts.

**Citations:**
- [King Arthur: Keep your baking crispy](https://www.kingarthurbaking.com/blog/2015/09/15/keep-baking-crispy)
- [Fresh Loaf: crispy crust softens on cooling](https://www.thefreshloaf.com/node/40818/crispy-crust-softens-cooling)

### Q4: Second-stage spritz / water splash vs. Dutch oven lid?

**Answer:** **Not needed — LOW priority for our setup.** A Dutch oven already traps more than enough steam; adding external water is either redundant (lid still on) or counterproductive (lid off and the crust is trying to dry).

- Spraying dough before baking extends pliability for oven spring, but we already get that from the lid
- The Perfect Loaf and KAB both note Dutch ovens already produce "more steam than you need"
- Relevant ONLY for open-oven baking (no Dutch oven) — not our setup

**Confidence: HIGH** — no source recommends spritz during uncovered phase in a Dutch oven workflow.

**Not worth experimenting with.** Deprioritized.

**Citations:**
- [Busby's Bakery: Adding water to an oven](https://www.busbysbakery.com/adding-water-to-an-oven/)
- [Pastry Arts: Steam at home](https://pastryartsmag.com/general/steam-at-home-the-inverted-tray-method/)

### Q5: Role of internal dough temperature in final crust texture?

**Answer:** Internal temperature (205-210°F range) primarily governs **crumb**, not crust. The 5°F difference matters at the margins:

- 205°F (96°C): slightly softer/moister crumb, crust development may be incomplete
- 210°F (99°C): denser/chewier crumb, crust fully set
- Above 210°F: crumb dries out excessively, crust can become leathery
- The Sourdough Journey: "Temperature sets the crust and length of bake sets the crumb" (paraphrased)

**Practical implication:** Pulling at 210°F+ is correct for a crispy crust. Stop second-guessing based on interior temp — let color/shell-feel drive the pull. Internal temp is a safety check, not the tuning knob.

**Confidence: MEDIUM** — sources agree on the target but with slight nuance in phrasing.

**Citations:**
- [Sourdough Baking Guide: internal temperature](https://sourdoughbakingguide.com/blog/sourdough-bread-internal-temperature-the-complete-guide/)
- [Fresh Loaf: Internal temps of bread](https://www.thefreshloaf.com/node/25262/internal-temps-bread-not-exactly-advanced)

### Q6: Post-bake handling (rack cooling, oven-off-door-cracked)?

**Answer:** **Biggest lever most home bakers skip.** Rack cooling in a humid kitchen softens the crust within 30 minutes. Finish-cold-in-oven preserves it.

Rank of post-bake options (best → worst for crust preservation):
1. **Oven off, door cracked 2", loaf on middle rack** (KAB technique) — best crust preservation
2. **Wire rack in very dry room** — good, standard
3. **Wire rack in humid room / over stovetop** — crust softens fastest
4. **Warm spot near stove** — worst of both worlds

Additional note: **do not slice for at least 1 hour, ideally 90 min** — the crumb is still setting and early slicing releases internal steam that hits the crust from the inside.

**Confidence: HIGH** — unanimous across KAB, TPL, Sourdough Journey, and community forums.

**Citations:**
- [King Arthur: Keep your baking crispy](https://www.kingarthurbaking.com/blog/2015/09/15/keep-baking-crispy)
- [Nordic Ware: How to make sourdough crust crispy](https://www.nordicware.com/how-to-make-sourdough-crust-crispy/)

### Cross-source confidence summary

| Driver | Confidence | Sources agree | Our baseline status |
|---|---|---|---|
| Surface moisture is the master variable | HIGH | 4/4 | Understood but not leveraged |
| Higher temp + shorter uncovered = thinner/crispier | HIGH | 3/4 explicit, 4/4 consistent | Baseline is LOW end (425-450°F) |
| Finish-cold-in-oven helps | MED-HIGH | 3/4 explicit, 0/4 disagree | Not currently used |
| Spritz during uncovered phase | HIGH (neg) | 0/4 recommend for Dutch oven | Not used — correct |
| Internal temp 210°F for crispy crust | MED | 3/4 explicit | Already doing this |
| Post-bake rack humidity matters | HIGH | 4/4 | Standard rack cooling — room for improvement |

### Dominant drivers for our setup (70% hydration, bread flour, Dutch oven)

In rank order of expected impact:

1. **Uncovered phase temperature** — 425-450°F is the LOW end of recommended. Moving to 475°F for the uncovered phase is the highest-confidence lever. (Experiment #1)
2. **Finish-cold in oven** — free improvement, zero-cost technique that no experiment has tried yet. (Experiment #2)
3. **Total uncovered time at a given temp** — lower-and-longer vs higher-and-shorter trade-off needs a direct head-to-head. (Experiment #3)
4. **Post-bake cooling environment** — humidity awareness; less a recipe change, more a kitchen habit. (Embedded in Experiment #2)

---

## Numbered Experiment Plan (3 experiments, ordered by confidence × impact)

All experiments use the current v3.2.0 recipe as the control baseline EXCEPT the variable being tested. Dough parameters fixed: 70% hydration, 100% bread flour, 20% inoculation, fermentolyse method, cold proof overnight, 500°F preheat, 450°F covered for ~22 min.

**Measurement rubric (consistent across all experiments):**
- **Crust thickness** — subjective (thin / medium / thick) by mouthfeel when biting
- **Crust crispness** — audible crack when squeezed or sliced? 1-5 scale
- **Crust crispness retention** — still crisp at 2 hours? At 6 hours? 1-5 scale
- **Crumb quality** — no regressions (open, tender, not gummy)
- **Overall preference** — ranked vs. previous bakes

Each experiment bake MUST log all 5 metrics in the cook_log entry and reference its experiment subtask ID.

### Experiment 1 — Uncovered phase at 475°F (HIGHEST PRIORITY)

- **Subtask:** PF-178.2
- **Hypothesis:** Raising the uncovered bake temperature from the current 425-450°F range to a sustained 475°F will produce a thinner, crispier, more crackly crust with no crumb regression.
- **Variable changed:** Uncovered bake temperature → 475°F (vs. 425-450°F baseline)
- **Variables held constant:** 500°F preheat, 450°F covered bake 22 min, uncovered duration 18 min (9 min + flip + 9 min), pull at 210°F internal, standard rack cool
- **Rationale:** The Perfect Loaf's explicit recommendation + Sourdough Journey corroboration. Our baseline sits at the bottom of the recommended range — likely the single biggest unlocked lever.
- **Pass criteria:** Crust crispness ≥4/5 (vs. Bake 12's informal ~3/5), crispness retention at 2hr ≥3/5, no crumb regression
- **Fail criteria:** Crust burns before internal temp hits 210°F, or crumb dries out
- **Cost:** 1 bake

### Experiment 2 — Finish-cold-in-oven technique

- **Subtask:** PF-178.3
- **Hypothesis:** Turning the oven off and letting loaves cool 10-15 min on the middle rack with the door cracked (folded potholder) before moving to wire rack will measurably improve crust crispness retention at the 2hr and 6hr marks.
- **Variable changed:** Post-bake cooling → oven off + door cracked for 10-15 min, then wire rack (vs. wire rack immediately)
- **Variables held constant:** Whatever uncovered temp wins from Experiment 1. Everything else identical to control.
- **Rationale:** KAB-authoritative technique, zero cost, no recipe-body change risk, and not yet in our workflow.
- **Pass criteria:** Crispness retention at 2hr improves by ≥1 point on the 1-5 scale vs Experiment 1 result
- **Fail criteria:** No measurable difference, or crumb becomes gummy from trapped moisture
- **Cost:** 1 bake (can stack on top of Experiment 1's winning temp)

### Experiment 3 — Lower-and-longer uncovered phase (420°F × 24 min)

- **Subtask:** PF-178.4
- **Hypothesis:** Lowering uncovered temp to 420°F and extending to ~24 min total (2× 12-min flips) produces a thicker, crunchier crust preferred for chew/structure, offering a second valid "crispy" flavor compared to Experiment 1.
- **Variable changed:** Uncovered bake → 420°F for 24 min (2× 12-min flips). Control is Experiment 1's 475°F result.
- **Variables held constant:** Everything else from the Experiment 1 + 2 winning configuration
- **Rationale:** Explicit outstanding hypothesis from PF-178 parent description. User wants to explore both ends of the spectrum before locking in. Head-to-head comparison clarifies which direction "crispy" should mean for this recipe.
- **Pass criteria:** Produces a distinct, thicker-but-still-crisp result; user can rank preference vs. Experiment 1
- **Fail criteria:** Crust becomes leathery / hard-to-cut, or crumb dries out from extended bake time
- **Cost:** 1 bake

### Summary table — ranked by confidence × impact

| # | Experiment | Subtask | Confidence | Expected Impact | Total Bakes |
|---|------------|---------|------------|-----------------|-------------|
| 1 | Uncovered at 475°F | PF-178.2 | HIGH | HIGH | 1 |
| 2 | Finish-cold-in-oven | PF-178.3 | MED-HIGH | MED | 1 |
| 3 | Lower-and-longer (420°F × 24 min) | PF-178.4 | MED | MED-HIGH (informational) | 1 |

**Minimum viable experiment phase: 3 bakes.** Sequence: E1 → E2 (built on E1 winner) → E3 (head-to-head vs E1+E2 winner).

### ACs unblocked by this spike

This spike output satisfies PF-178 parent ACs #2 (numbered experiment plan with 3-5 experiments, each isolating a variable) and unblocks #3 (experiment subtask creation).

## User bake experiment results (2026-04-11 sweep)

Tried the planned experiments. Settled on personal preferred method:

- Preheat super hot: 500-550°F
- Covered bake: 480°F for first 20 minutes
- Uncovered with rotations: 425°F for 18 minutes + ~4 min buffer to reach desired crust color
- Note: keeps forgetting to take internal bread temp at pull — could be a gate in a future "start bake" mode

This is the user's chosen method going forward. Differs slightly from the spike experiment plan (which tested 475°F uncovered and finish-cold-in-oven). User went with their own variation based on real bake experience.
<!-- SECTION:NOTES:END -->
