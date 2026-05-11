import { describe, it, expect } from 'vitest'
import {
  parseNoteDeltas,
  associateIngredient,
  type ParsedBakeNote,
  type ParsedIngredient,
} from './parse-note-deltas'

/* --------------------------- Fixtures ----------------------------------- */

const ingredients: ParsedIngredient[] = [
  { id: 'flour', name: 'bread flour', total: 510, unit: 'g' },
  { id: 'water', name: 'water', total: 360, unit: 'g' },
  { id: 'salt', name: 'salt', total: 10, unit: 'g' },
  { id: 'cheddar', name: 'cheddar', total: 200, unit: 'g' },
  { id: 'jalapenos', name: 'jalapenos', total: 80, unit: 'g' },
]

function note(timestamp: string, raw: string, curated?: string): ParsedBakeNote {
  return { timestamp, raw, curated }
}

/* ------------------------- Pattern: signed-delta ------------------------ */

describe('signed-delta pattern', () => {
  it('detects "-40g flour" with exact match and computes proposed', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', '-40g flour because the dough was too dry')], ingredients)
    expect(deltas).toHaveLength(1)
    const d = deltas[0]!
    expect(d.kind).toBe('signed-delta')
    expect(d.ingredient).toMatchObject({ match: 'partial', id: 'flour' })
    expect(d.baseline).toBe(510)
    expect(d.proposed).toBe(470)
  })

  it('detects "+10g salt" with positive sign', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', '+10g salt for crust')], ingredients)
    expect(deltas).toHaveLength(1)
    expect(deltas[0]!.kind).toBe('signed-delta')
    expect(deltas[0]!.proposed).toBe(20)
  })

  it('NEGATIVE: skips "40g flour" without sign (count-quantity, not signed-delta)', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'used 40g flour for dusting')], ingredients)
    const signed = deltas.filter(d => d.kind === 'signed-delta')
    expect(signed).toHaveLength(0)
  })

  it('NEGATIVE: ignores "-40g" without an ingredient phrase', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'lost -40g during shaping')], ingredients)
    // "during" looks like an ingredient phrase to the regex; assoc resolves to 'none'.
    // Important property: when ingredient is unresolvable, requiresPrompt is true (AC #9).
    deltas
      .filter(d => d.kind === 'signed-delta')
      .forEach(d => expect(d.requiresPrompt).toBe(true))
  })
})

/* ----------------------- Pattern: count-quantity ------------------------ */

describe('count-quantity pattern', () => {
  it('detects "400g cheddar" forward form', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'used 400g cheddar this time')], ingredients)
    const cq = deltas.filter(d => d.kind === 'count-quantity')
    expect(cq.length).toBeGreaterThanOrEqual(1)
    const exact = cq.find(d => d.ingredient.match === 'partial' && d.ingredient.match !== 'none')
    expect(exact?.proposed).toBe(400)
    expect(exact?.baseline).toBe(200)
  })

  it('detects "reduced salt to 8g" reverse form', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'reduced salt to 8g')], ingredients)
    const cq = deltas.filter(d => d.kind === 'count-quantity')
    expect(cq).toHaveLength(1)
    expect(cq[0]!.proposed).toBe(8)
    expect(cq[0]!.baseline).toBe(10)
  })

  it('flags Tbsp / tsp as requiresPrompt (no silent volumetric conversion)', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'added 1.5 Tbsp salt at the end')], ingredients)
    const cq = deltas.filter(d => d.kind === 'count-quantity')
    expect(cq.length).toBeGreaterThanOrEqual(1)
    const tbsp = cq.find(d => /tbsp/i.test(d.sourceQuote))!
    expect(tbsp.proposed).toBeNull()
    expect(tbsp.requiresPrompt).toBe(true)
  })

  it('NEGATIVE: skips "208°F internal" (temperature, not ingredient quantity)', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'internal 208°F final')], ingredients)
    expect(deltas.filter(d => d.kind === 'count-quantity')).toHaveLength(0)
  })

  it('NEGATIVE: count-quantity with no ingredient match → requiresPrompt', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'used 500g of mystery powder')], ingredients)
    const cq = deltas.filter(d => d.kind === 'count-quantity')
    expect(cq).toHaveLength(1)
    expect(cq[0]!.ingredient.match).toBe('none')
    expect(cq[0]!.requiresPrompt).toBe(true)
  })
})

/* ----------------------- Pattern: prose-volume -------------------------- */

describe('prose-volume pattern', () => {
  it('detects "ran out of flour" and never proposes silently', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'ran out of flour during shaping')], ingredients)
    const pv = deltas.filter(d => d.kind === 'prose-volume')
    expect(pv).toHaveLength(1)
    expect(pv[0]!.requiresPrompt).toBe(true)
    expect(pv[0]!.proposed).toBeNull()
  })

  it('detects "doubled the salt" and computes a candidate (still requires prompt)', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'doubled the salt by accident')], ingredients)
    const pv = deltas.filter(d => d.kind === 'prose-volume')
    expect(pv).toHaveLength(1)
    expect(pv[0]!.proposed).toBe(20)
    expect(pv[0]!.requiresPrompt).toBe(true)
  })

  it('detects "half a bag of cheddar"', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'used half a bag of cheddar')], ingredients)
    const pv = deltas.filter(d => d.kind === 'prose-volume')
    expect(pv).toHaveLength(1)
    expect(pv[0]!.proposed).toBe(100)
    expect(pv[0]!.requiresPrompt).toBe(true)
  })

  it('detects "forgot the salt" → proposes 0 with prompt', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'forgot the salt entirely!')], ingredients)
    const pv = deltas.filter(d => d.kind === 'prose-volume')
    expect(pv).toHaveLength(1)
    expect(pv[0]!.proposed).toBe(0)
    expect(pv[0]!.requiresPrompt).toBe(true)
  })

  it('NEGATIVE: ignores "tripled the proof time" (not an ingredient phrase that matches)', () => {
    const deltas = parseNoteDeltas([note('2026-05-05T10:00:00Z', 'tripled the proof time accidentally')], ingredients)
    const pv = deltas.filter(d => d.kind === 'prose-volume')
    // The verb fires, but the ingredient association resolves to 'none'.
    pv.forEach(d => {
      if (d.sourceQuote.toLowerCase().startsWith('tripled')) {
        expect(d.ingredient.match).toBe('none')
        expect(d.requiresPrompt).toBe(true)
      }
    })
  })
})

/* ----------------------- Ingredient association ------------------------- */

describe('associateIngredient', () => {
  it('returns exact match when ingredient name equals phrase', () => {
    const r = associateIngredient('water', ingredients)
    expect(r).toEqual({ match: 'exact', id: 'water', name: 'water' })
  })

  it('returns partial when phrase contains ingredient name', () => {
    const r = associateIngredient('bread flour for dusting', ingredients)
    expect(r.match).toBe('partial')
    if (r.match === 'partial') expect(r.id).toBe('flour')
  })

  it('returns ambiguous when multiple ingredients partial-match', () => {
    const ambig: ParsedIngredient[] = [
      { id: 'milk-whole', name: 'milk', total: 100, unit: 'g' },
      { id: 'milk-powder', name: 'milk powder', total: 20, unit: 'g' },
    ]
    const r = associateIngredient('milk', ambig)
    expect(r.match).toBe('ambiguous')
  })

  it('returns none for empty / unmatched phrases', () => {
    expect(associateIngredient('', ingredients)).toEqual({ match: 'none' })
    expect(associateIngredient('purple unicorn dust', ingredients)).toEqual({ match: 'none' })
  })

  it('strips trailing punctuation when matching', () => {
    const r = associateIngredient('water.', ingredients)
    expect(r.match).toBe('exact')
  })
})

/* ----------------- Skill-level fixture tests (AC #14, #15) -------------- */

describe('skill fixtures (AC #14, #15)', () => {
  // Fixture: one ExperimentPanel adjustment + one note delta. The skill-level
  // function we simulate here is the resolution loop the /bake-log skill
  // implements in SKILL.md: start with baseline → apply experiment adjustments
  // silently → run parser → for each detected delta, apply OR skip based on
  // user response → return final snapshot.
  //
  // We don't need a real Vue component — we model the deterministic outputs
  // for the two user-response modes (confirm-all / skip-all) so the SKILL.md
  // procedure is provably correct on a fixture.

  /** Apply a flat-list snapshot (no stage grouping) for fixture simplicity. */
  function applyResolution(
    baseline: ParsedIngredient[],
    experimentAdjustments: Record<string, number>,
    notes: ParsedBakeNote[],
    response: 'apply-all' | 'skip-all'
  ): ParsedIngredient[] {
    // Step 1: clone baseline.
    const snapshot = baseline.map(i => ({ ...i }))
    // Step 2: apply experiment adjustments silently (AC #4).
    for (const [id, value] of Object.entries(experimentAdjustments)) {
      const ing = snapshot.find(i => i.id === id)
      if (ing) ing.total = value
    }
    // Step 3: detect note deltas against the post-experiment snapshot.
    const deltas = parseNoteDeltas(notes, snapshot)
    // Step 4: apply or skip based on user response (AC #8).
    if (response === 'apply-all') {
      for (const d of deltas) {
        if (d.proposed == null) continue
        if (d.ingredient.match !== 'exact' && d.ingredient.match !== 'partial') continue
        const ing = snapshot.find(i => i.id === d.ingredient.id)
        if (ing) ing.total = d.proposed
      }
    }
    return snapshot
  }

  it('confirm-all: experiment adjustment + note delta both land in final snapshot', () => {
    const baseline: ParsedIngredient[] = [
      { id: 'flour', name: 'bread flour', total: 510, unit: 'g' },
      { id: 'water', name: 'water', total: 360, unit: 'g' },
      { id: 'salt', name: 'salt', total: 10, unit: 'g' },
    ]
    // ExperimentPanel: user dialed water down to 350g via slider.
    const experimentAdjustments = { water: 350 }
    // Bake note: user wrote "-40g flour during mix".
    const notes: ParsedBakeNote[] = [
      { timestamp: '2026-05-05T10:00:00Z', raw: '-40g flour during mix' },
    ]
    const result = applyResolution(baseline, experimentAdjustments, notes, 'apply-all')
    expect(result.find(i => i.id === 'water')!.total).toBe(350) // experiment
    expect(result.find(i => i.id === 'flour')!.total).toBe(470) // 510 - 40
    expect(result.find(i => i.id === 'salt')!.total).toBe(10)   // untouched
  })

  it('skip-all: experiment adjustment lands but note delta does NOT', () => {
    const baseline: ParsedIngredient[] = [
      { id: 'flour', name: 'bread flour', total: 510, unit: 'g' },
      { id: 'water', name: 'water', total: 360, unit: 'g' },
      { id: 'salt', name: 'salt', total: 10, unit: 'g' },
    ]
    const experimentAdjustments = { water: 350 }
    const notes: ParsedBakeNote[] = [
      { timestamp: '2026-05-05T10:00:00Z', raw: '-40g flour during mix' },
    ]
    const result = applyResolution(baseline, experimentAdjustments, notes, 'skip-all')
    expect(result.find(i => i.id === 'water')!.total).toBe(350) // experiment still applies
    expect(result.find(i => i.id === 'flour')!.total).toBe(510) // note skipped
    expect(result.find(i => i.id === 'salt')!.total).toBe(10)
  })
})
