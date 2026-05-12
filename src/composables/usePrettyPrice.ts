/**
 * Pretty-price snap algorithm for the /pricing route (PF-255 epic).
 *
 * Implements §2 (breakpoint policy) and §3 (snap algorithm) from
 * `backlog/tasks/pf-255.2-spike-notes.md`. Pure functions — no Vue
 * reactivity, no side effects — easy to unit-test.
 *
 * Conventions:
 * - All prices in USD.
 * - All cent endings expressed as integer cents (e.g. 99, 95, 50, 0).
 * - Rounding to 2 decimal places at every return boundary.
 */

/** Round a dollar amount to the nearest cent. */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Allowed cent-endings for a given dollar amount, in **preference order**.
 * First-listed wins tie-breaks when two candidates are equidistant from raw.
 *
 * Tier table (per spike notes §2):
 *   <$1         → [99]              (charm only — sub-dollar items snap to $0.99)
 *   <$5         → [99, 95, 50]
 *   $5–$10      → [99, 95, 50, 0]
 *   $10–$20     → [99, 50, 0]
 *   ≥$20        → [0, 99, 50]       (prefer whole dollar for premium framing)
 */
export function allowedEndings(price: number): number[] {
  if (price < 1) return [99]
  if (price < 5) return [99, 95, 50]
  if (price < 10) return [99, 95, 50, 0]
  if (price < 20) return [99, 50, 0]
  return [0, 99, 50]
}

export interface SnapResult {
  /** Snapped to the nearest pretty breakpoint. */
  prettyPrice: number
  /** Next pretty value above `prettyPrice` (always > prettyPrice). */
  nextPrettyUp: number
  /** Next pretty value below `prettyPrice` (always < prettyPrice). */
  nextPrettyDown: number
}

/**
 * Generate candidate prices around `raw` for the snap algorithm.
 * Produces candidates for floor(raw)-1, floor(raw), and floor(raw)+1 across
 * all endings — wide enough net to always have an "up" and "down" neighbor.
 */
function generateCandidates(raw: number): number[] {
  const endings = allowedEndings(raw)
  const baseDollar = Math.floor(raw)
  const candidates = new Set<number>()
  for (const d of [baseDollar - 1, baseDollar, baseDollar + 1, baseDollar + 2]) {
    if (d < 0) continue
    for (const ending of endings) {
      const cand = round2(d + ending / 100)
      if (cand > 0) candidates.add(cand)
    }
  }
  return Array.from(candidates).sort((a, b) => a - b)
}

/**
 * Snap a raw price to the nearest "pretty" breakpoint.
 *
 * Algorithm (per spike notes §3):
 *   1. Generate candidates from allowedEndings() across nearby dollar values
 *   2. Pick the candidate with min |candidate − raw|
 *   3. Tie-break by allowedEndings() preference order
 *   4. nextPrettyUp = smallest candidate > prettyPrice
 *      nextPrettyDown = largest candidate < prettyPrice
 *
 * Sub-$1 raw prices snap to $0.99 (5-cent increment fallback noted in spike
 * §3 edge cases — simplified here to the dominant charm ending).
 */
export function snapToPretty(rawPrice: number): SnapResult {
  const raw = round2(rawPrice)
  const candidates = generateCandidates(raw)
  const endingsByPref = allowedEndings(raw)
  const prefIndex = (c: number): number => {
    const ending = Math.round((c - Math.floor(c)) * 100)
    const idx = endingsByPref.indexOf(ending)
    return idx === -1 ? endingsByPref.length : idx
  }

  // Sort by distance, then by preference order
  const sorted = [...candidates].sort((a, b) => {
    const da = Math.abs(a - raw)
    const db = Math.abs(b - raw)
    if (da !== db) return da - db
    return prefIndex(a) - prefIndex(b)
  })

  const prettyPrice = sorted[0] ?? round2(raw)

  // Find up/down neighbors among the full candidate set
  const above = candidates.filter(c => c > prettyPrice)
  const below = candidates.filter(c => c < prettyPrice)
  const nextPrettyUp = above.length > 0 ? above[0] : round2(prettyPrice + 1)
  const nextPrettyDown = below.length > 0 ? below[below.length - 1] : round2(Math.max(0, prettyPrice - 1))

  return { prettyPrice, nextPrettyUp, nextPrettyDown }
}

export interface PricingComputation {
  /** Raw (unsnapped) price: cost × (1 + markupPct/100). */
  rawPrice: number
  /** Snapped pretty price (display value). */
  prettyPrice: number
  /** Next pretty value above prettyPrice. */
  nextPrettyUp: number
  /** Next pretty value below prettyPrice. */
  nextPrettyDown: number
  /** Contribution profit in dollars at prettyPrice. */
  cp: number
  /** Contribution profit as a percentage of prettyPrice (0–100). */
  cpPct: number
  /** Contribution profit at nextPrettyUp. */
  cpAtNextUp: number
  /** Contribution profit at nextPrettyDown. */
  cpAtNextDown: number
}

/**
 * Compute the full pricing readout for a given cost and markup percentage.
 * Returns raw, snapped pretty, neighbors, and CP at each.
 */
export function computePricing(cost: number, markupPct: number): PricingComputation {
  const rawPrice = round2(cost * (1 + markupPct / 100))
  const { prettyPrice, nextPrettyUp, nextPrettyDown } = snapToPretty(rawPrice)
  const cp = round2(prettyPrice - cost)
  const cpPct = prettyPrice > 0 ? round2((cp / prettyPrice) * 100) : 0
  const cpAtNextUp = round2(nextPrettyUp - cost)
  const cpAtNextDown = round2(nextPrettyDown - cost)
  return {
    rawPrice,
    prettyPrice,
    nextPrettyUp,
    nextPrettyDown,
    cp,
    cpPct,
    cpAtNextUp,
    cpAtNextDown,
  }
}
