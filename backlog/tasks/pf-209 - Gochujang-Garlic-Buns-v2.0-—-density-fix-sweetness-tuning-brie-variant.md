---
id: PF-209
title: 'Gochujang Garlic Buns v2.0 — density fix, sweetness tuning, brie variant'
status: To Do
assignee: []
created_date: '2026-04-20 01:54'
labels:
  - recipe-update
dependencies: []
priority: high
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Butter increased to ~14% baker's percentage (55-60g range)
- [ ] #2 Flour blend: bread + cake flour (reduce overall protein)
- [ ] #3 15g milk powder added to dough
- [ ] #4 Process protocol documented: windowpane test, poke test, 190F pull temp
- [ ] #5 Brie-stuffed variant shaping procedure documented in recipe JSON
- [ ] #6 Sweetness lever decided after bake #2 review
- [ ] #7 Version bumped to v2.0.0 with changelog entry
- [ ] #8 npm run build passes
<!-- AC:END -->

## Implementation Notes

**Blocked by:** Bake log #2 — append log + review photos first. Update this task with bake #2 learnings before executing.

**Version rationale:** Major bump v1.x → v2.0.0. Diverging from Dylan's original with our own ideas (density overhaul, flour blend, brie variant). No longer a faithful adaptation — this is ours now.

---

### Density Fix (high confidence — 3 research agents converge)

Root cause: butter at 6.7% is 1/3 of every soft-bun benchmark (10-20%). Dylan's original is itself lean.

**Formula:**
- Butter: 28g → 57g (6.7% → 14%)
- Flour: 400g bread → 350g bread + 50g cake
- Add 15g NFDM (milk powder)
- Softened butter added mid-knead, not melted

**Process:**
- Windowpane test before first rise (non-negotiable)
- Poke test for proofing (expect 1.5-2hr first rise)
- Pull at 190°F (bake #1 hit 210°F)
- Garlic fold via lamination technique
- Start checking temp at 18-20 min

**Benchmarks:** KA Milk Bread 18.2%, Hokkaido 15.5%, Char Siu Bao 15.0%, Chinglish 10.0% butter

---

### Sweetness Tuning (low intervention — already 9.5%)

- Tier 1 (no sugar added): milk powder handles this + tangzhong with milk instead of water + 3-5g toasted sesame oil in glaze
- Tier 2 (if needed): glaze honey 30→40g, or swap 15g caster → brown sugar, or add 5-10g mirin
- Tier 3 (deliberate): 10g honey in dough, condensed milk, bump caster 40→50g
- Decision deferred to after bake #2 review

---

### Brie Variant (strong pairing)

**Flavor:** HIGH confidence. Rose tteokbokki = proof cream + gochujang works. Brie > mozz for flavor.

**Technique (flatten-wrap-pinch / bao method):**
- 15-20g frozen brie cubes, rind on (structural containment)
- 90g dough per piece (75g → 90g), yield 10 → 8
- Skip scoring on stuffed buns
- Bake 27-32 min, check dough wall temp
- Split batch first time: half stuffed, half plain

---

### Bake #2 Observations (pending full log)

- Used cupcake/muffin pan — exploring tin format for cheese-stuffed
- Want more flavor from bread itself (not just toppings/glaze)
- Flatter surface pan may work better than cupcake wells
- Cheese filling confirmed by taster experience with brie

---

### Research Sources (2026-04-19)

9 parallel agents: density (baker's %, process, community comparison), sweetness (sugar types, glaze mods, indirect methods), brie (stuffed techniques, flavor pairing, wrapping technique). ~40 web sources consulted.
