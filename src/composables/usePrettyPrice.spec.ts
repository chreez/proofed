import { describe, it, expect } from 'vitest'
import { allowedEndings, snapToPretty, computePricing } from './usePrettyPrice'

describe('allowedEndings', () => {
  it('returns [99] for sub-dollar prices', () => {
    expect(allowedEndings(0.5)).toEqual([99])
    expect(allowedEndings(0.99)).toEqual([99])
  })

  it('returns [99, 95, 50] for prices under $5', () => {
    expect(allowedEndings(2.5)).toEqual([99, 95, 50])
    expect(allowedEndings(4.99)).toEqual([99, 95, 50])
  })

  it('returns [99, 95, 50, 0] for $5–$10', () => {
    expect(allowedEndings(5)).toEqual([99, 95, 50, 0])
    expect(allowedEndings(9.99)).toEqual([99, 95, 50, 0])
  })

  it('returns [99, 50, 0] for $10–$20', () => {
    expect(allowedEndings(10)).toEqual([99, 50, 0])
    expect(allowedEndings(19.99)).toEqual([99, 50, 0])
  })

  it('returns [0, 99, 50] for prices >= $20 (premium framing)', () => {
    expect(allowedEndings(20)).toEqual([0, 99, 50])
    expect(allowedEndings(25)).toEqual([0, 99, 50])
    expect(allowedEndings(100)).toEqual([0, 99, 50])
  })
})

describe('snapToPretty', () => {
  it('snaps a sub-$5 raw price to the nearest allowed ending', () => {
    // raw 3.60: candidates around it include 2.99, 3.50, 3.95, 3.99, 4.50, 4.95
    // closest is 3.50 (|3.60-3.50|=0.10)
    const r = snapToPretty(3.6)
    expect(r.prettyPrice).toBe(3.5)
    expect(r.nextPrettyUp).toBeGreaterThan(r.prettyPrice)
    expect(r.nextPrettyDown).toBeLessThan(r.prettyPrice)
  })

  it('snaps a $5–$10 raw price', () => {
    // raw 7.00: nearest pretty = 6.99 (|7-6.99|=0.01) wins over 7.50 (0.50) and 7.00 (0.00 but 0-ending only)
    // Actually 7.00 is a candidate (ending 0 allowed in 5-10 tier). |7-7|=0, vs |7-6.99|=0.01
    // 7.00 wins on distance.
    const r = snapToPretty(7.0)
    expect(r.prettyPrice).toBe(7.0)
  })

  it('snaps a $10–$20 raw price', () => {
    // raw 12.60: candidates 11.99, 12.00, 12.50, 12.99, 13.00, 13.50, 13.99
    // closest is 12.50 (|12.60-12.50|=0.10)
    const r = snapToPretty(12.6)
    expect(r.prettyPrice).toBe(12.5)
  })

  it('snaps a >=$20 raw price toward whole dollars', () => {
    // raw 25.20 with allowed [0, 99, 50]
    // candidates around: 24.00, 24.50, 24.99, 25.00, 25.50, 25.99, 26.00
    // distance 25.00 = 0.20, 24.99 = 0.21 — 25.00 wins
    const r = snapToPretty(25.2)
    expect(r.prettyPrice).toBe(25)
  })

  it('provides nextPrettyUp and nextPrettyDown', () => {
    const r = snapToPretty(3.6)
    expect(r.nextPrettyUp).toBeGreaterThan(r.prettyPrice)
    expect(r.nextPrettyDown).toBeLessThan(r.prettyPrice)
  })

  it('returns sensible result for very small prices', () => {
    const r = snapToPretty(0.5)
    expect(r.prettyPrice).toBeGreaterThan(0)
    // Sub-$1 tier: ending [99]; 0.99 candidate vs 1.99 — 0.99 closer to 0.5? |0.5-0.99|=0.49 vs |0.5-1.99|=1.49. So 0.99 wins.
    expect(r.prettyPrice).toBe(0.99)
  })
})

describe('computePricing', () => {
  it('returns raw, pretty, and CP for a typical bake', () => {
    const r = computePricing(2.5, 150)
    expect(r.rawPrice).toBe(6.25)
    // cost 2.50, markup 150 → raw 6.25 in $5-$10 tier
    // candidates near 6.25: 5.99, 6.00, 6.50, 6.99
    // closest: 6.00 (|6.25-6.00|=0.25) ties with 6.50 (0.25), pref ranks: 99>95>50>0; 6.50 has ending 50 (idx 2), 6.00 has ending 0 (idx 3). 6.50 wins.
    expect(r.prettyPrice).toBe(6.5)
    expect(r.cp).toBe(4)
    expect(r.cpPct).toBeCloseTo(61.54, 1)
  })

  it('returns 0 CP when cost equals price', () => {
    const r = computePricing(5, 0)
    // raw = 5.00, in $5-10 tier, snap candidates include 5.00 (0-ending), nearest = 5.00
    expect(r.cp).toBe(0)
    expect(r.cpPct).toBe(0)
  })

  it('provides cp at next-up and next-down', () => {
    const r = computePricing(2.5, 150)
    expect(r.cpAtNextUp).toBeGreaterThan(r.cp)
    expect(r.cpAtNextDown).toBeLessThan(r.cp)
  })

  it('handles cost 0 gracefully without dividing by zero in cpPct when raw is 0', () => {
    // edge: cost 0, markup 0 → raw 0 → snap result depends but cp should be defined
    const r = computePricing(0, 0)
    expect(r.rawPrice).toBe(0)
    expect(Number.isFinite(r.cp)).toBe(true)
    expect(Number.isFinite(r.cpPct)).toBe(true)
  })
})
