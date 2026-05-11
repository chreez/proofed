/**
 * parse-note-deltas (PF-244)
 *
 * Pure module that scans bake notes for ingredient-quantity mentions and
 * proposes deltas the agent should echo to the user. Used by the /bake-log
 * skill's Snapshot Resolution phase before writing cook_log[].ingredients.
 *
 * The parser is deliberately conservative — it surfaces *candidates*, never
 * applies them silently. Cook Log Protocol / Mozzarella Rule applies:
 * the user always confirms before any delta lands in JSON. Ambiguity is
 * preserved (low confidence, requiresPrompt) so the skill can prompt.
 *
 * Pattern catalog (AC #5):
 *   1. signed-delta     "-40g flour", "+10g salt"               → relative gram delta
 *   2. count-quantity   "400g cheddar", "550g instead of 510g"  → absolute gram value
 *   3. prose-volume     "half a bag", "ran out", "doubled X"    → fuzzy multiplier
 *
 * Ingredient association (AC #6) is exact match (case-insensitive substring)
 * → partial match → ambiguous (requiresPrompt). Never silent.
 */

/* ----------------------------- Types ------------------------------------ */

/** Minimal subset of BakeNote consumed by the parser. */
export interface ParsedBakeNote {
  /** ISO 8601 UTC timestamp from scratchpad capture */
  timestamp: string
  /** Verbatim user text */
  raw: string
  /** Curated text (preferred when present) */
  curated?: string
}

/** Minimal subset of Ingredient the parser needs for matching. */
export interface ParsedIngredient {
  id: string
  name: string
  /** Baseline grams (post-multiplier) on the bake snapshot */
  total: number
  unit: string
}

export type DeltaKind = 'signed-delta' | 'count-quantity' | 'prose-volume'

/** A delta candidate detected from a single note. Always requires user
 *  confirmation before being applied (AC #9). */
export interface DetectedDelta {
  /** Which pattern bucket fired. */
  kind: DeltaKind
  /** ISO 8601 timestamp of the source note. */
  noteTimestamp: string
  /** Verbatim quote from the note that triggered the match. */
  sourceQuote: string
  /** The full note text (curated when present, raw otherwise). */
  noteText: string
  /** The ingredient association — exact, partial, or ambiguous. */
  ingredient: IngredientAssociation
  /** Baseline grams (lookup), if association resolved. */
  baseline: number | null
  /** Proposed grams after applying the delta. Null when unresolvable
   *  (e.g. prose-volume without quantitative input). */
  proposed: number | null
  /** True when the parser cannot resolve unambiguously and the skill MUST
   *  prompt the user (Mozzarella Rule, AC #6 / AC #9). */
  requiresPrompt: boolean
  /** Free-form note for the agent on why a prompt is needed. */
  prompt?: string
}

export type IngredientAssociation =
  | { match: 'exact'; id: string; name: string }
  | { match: 'partial'; id: string; name: string }
  | { match: 'ambiguous'; candidates: { id: string; name: string }[] }
  | { match: 'none' }

/* --------------------------- Public API --------------------------------- */

/**
 * Scan all notes for quantity-mention patterns and return one
 * DetectedDelta per match. Order is stable: notes first (chronological),
 * then patterns within a note (signed-delta → count-quantity → prose-volume).
 */
export function parseNoteDeltas(
  notes: ParsedBakeNote[],
  ingredients: ParsedIngredient[]
): DetectedDelta[] {
  const out: DetectedDelta[] = []
  for (const note of notes) {
    const text = note.curated ?? note.raw
    if (!text) continue
    out.push(...detectSignedDeltas(note, text, ingredients))
    out.push(...detectCountQuantities(note, text, ingredients))
    out.push(...detectProseVolumes(note, text, ingredients))
  }
  return out
}

/* ------------------------- Pattern: signed-delta ------------------------ */

// Examples: "-40g flour", "+10g salt", "−15g water" (unicode minus too)
// Captures: sign, amount (digits/decimal), unit, ingredient phrase tail.
// Tail is bounded to ~3 words so we don't gobble "flour during mix" as one
// ingredient phrase. Stops at common connectors via word-boundary stop list.
const SIGNED_DELTA_RE =
  /([+\-−])\s*(\d+(?:\.\d+)?)\s*(g|grams?|kg|ml)\b\s+(?:of\s+)?([a-z][a-z\-']*(?:\s+[a-z][a-z\-']*){0,2})/gi

// Stop-words that terminate an ingredient phrase in signed-delta tails.
// The signed-delta regex is greedy (up to 3 words), so we post-trim to drop
// connector words like "because", "during", "for", "in" so the captured tail
// only includes plausible ingredient tokens.
const TAIL_STOP_WORDS = new Set([
  'because',
  'during',
  'in',
  'for',
  'and',
  'when',
  'while',
  'after',
  'before',
  'so',
  'but',
  'to',
  'at',
  'on',
  'by',
  'the',
])

/** Trim trailing stop-words from a captured tail phrase. Returns the
 *  ingredient-portion of the phrase (1+ words, no connectors). */
function trimTailStopWords(tail: string): string {
  const words = tail.trim().split(/\s+/)
  const kept: string[] = []
  for (const w of words) {
    const bare = w.toLowerCase().replace(/[.,;:!?]+$/, '')
    if (TAIL_STOP_WORDS.has(bare)) break
    kept.push(w)
  }
  return kept.join(' ')
}

function detectSignedDeltas(
  note: ParsedBakeNote,
  text: string,
  ingredients: ParsedIngredient[]
): DetectedDelta[] {
  const out: DetectedDelta[] = []
  for (const match of text.matchAll(SIGNED_DELTA_RE)) {
    const [whole, sign, rawAmt, unit, tail] = match
    const grams = toGrams(parseFloat(rawAmt), unit)
    if (grams == null) continue
    const signed = sign === '+' ? grams : -grams
    const trimmedTail = trimTailStopWords(tail)
    const assoc = associateIngredient(trimmedTail, ingredients)
    const baseline = baselineFor(assoc, ingredients)
    const proposed = baseline != null ? Math.max(0, baseline + signed) : null
    out.push({
      kind: 'signed-delta',
      noteTimestamp: note.timestamp,
      sourceQuote: whole.trim(),
      noteText: text,
      ingredient: assoc,
      baseline,
      proposed,
      requiresPrompt: assoc.match !== 'exact',
      prompt:
        assoc.match === 'exact'
          ? undefined
          : promptForAssociation(assoc, trimmedTail || tail.trim()),
    })
  }
  return out
}

/* ---------------------- Pattern: count-quantity ------------------------- */

// Examples: "400g cheddar", "used 550g instead of 510g", "reduced salt to 8g",
// "10ml vanilla", "1.5 Tbsp olive oil", "2 tsp salt"
// Two sub-forms:
//   A) AMOUNT UNIT INGREDIENT     → "400g cheddar"
//   B) INGREDIENT … to AMOUNT UNIT → "reduced salt to 8g"
const COUNT_QTY_FORWARD_RE =
  /(?<![+\-−])\b(\d+(?:\.\d+)?)\s*(g|grams?|kg|ml|tbsp|tablespoons?|tsp|teaspoons?)\b\s+(?:of\s+)?([a-z][a-z\-']*(?:\s+[a-z][a-z\-']*){0,2})/gi
const COUNT_QTY_REVERSE_RE =
  /\b(?:reduced|increased|set|adjusted|changed|brought|cut|bumped)\s+([a-z][a-z\-']*(?:\s+[a-z][a-z\-']*){0,2}?)\s+(?:to|down to|up to)\s+(\d+(?:\.\d+)?)\s*(g|grams?|kg|ml|tbsp|tablespoons?|tsp|teaspoons?)\b/gi

function detectCountQuantities(
  note: ParsedBakeNote,
  text: string,
  ingredients: ParsedIngredient[]
): DetectedDelta[] {
  const out: DetectedDelta[] = []

  // Skip if the same span was already classified as signed-delta — we don't
  // want double-emission. Signed-delta requires a leading sign, so the
  // forward regex naturally won't match those (no sign captured).
  for (const match of text.matchAll(COUNT_QTY_FORWARD_RE)) {
    const [whole, rawAmt, unit, tail] = match
    if (looksLikeStat(whole, text, match.index ?? 0)) continue
    const grams = toGrams(parseFloat(rawAmt), unit)
    const assoc = associateIngredient(tail, ingredients)
    const baseline = baselineFor(assoc, ingredients)
    out.push({
      kind: 'count-quantity',
      noteTimestamp: note.timestamp,
      sourceQuote: whole.trim(),
      noteText: text,
      ingredient: assoc,
      baseline,
      proposed: grams,
      requiresPrompt: grams == null || assoc.match !== 'exact',
      prompt:
        grams == null
          ? `Parser couldn't convert "${whole.trim()}" to grams — confirm with user.`
          : assoc.match === 'exact'
            ? undefined
            : promptForAssociation(assoc, tail.trim()),
    })
  }

  for (const match of text.matchAll(COUNT_QTY_REVERSE_RE)) {
    const [whole, ingredientPhrase, rawAmt, unit] = match
    const grams = toGrams(parseFloat(rawAmt), unit)
    const assoc = associateIngredient(ingredientPhrase, ingredients)
    const baseline = baselineFor(assoc, ingredients)
    out.push({
      kind: 'count-quantity',
      noteTimestamp: note.timestamp,
      sourceQuote: whole.trim(),
      noteText: text,
      ingredient: assoc,
      baseline,
      proposed: grams,
      requiresPrompt: grams == null || assoc.match !== 'exact',
      prompt:
        grams == null
          ? `Parser couldn't convert "${whole.trim()}" to grams — confirm with user.`
          : assoc.match === 'exact'
            ? undefined
            : promptForAssociation(assoc, ingredientPhrase.trim()),
    })
  }

  return out
}

/* ----------------------- Pattern: prose-volume -------------------------- */

// Examples: "ran out of flour", "used half a bag of cheese",
// "doubled the salt", "forgot the salt"
// Always requires user prompt — proposed value is heuristic at best.
const PROSE_RAN_OUT_RE =
  /\bran\s+out(?:\s+of\s+([a-z][a-z\s\-']{1,40}))?/gi
const PROSE_HALF_FULL_RE =
  /\b(half|full|whole|entire)\s+(?:a|an|the)?\s*(?:bag|can|jar|tub|block|stick|cup|container|package|packet)\b\s*(?:of\s+([a-z][a-z\s\-']{1,40}))?/gi
const PROSE_DOUBLED_RE =
  /\b(doubled|tripled|halved|forgot)\s+(?:the\s+)?([a-z][a-z\s\-']{1,40})/gi

function detectProseVolumes(
  note: ParsedBakeNote,
  text: string,
  ingredients: ParsedIngredient[]
): DetectedDelta[] {
  const out: DetectedDelta[] = []

  for (const match of text.matchAll(PROSE_RAN_OUT_RE)) {
    const [whole, tail] = match
    const assoc = tail
      ? associateIngredient(tail, ingredients)
      : ({ match: 'none' } as const)
    const baseline = baselineFor(assoc, ingredients)
    out.push({
      kind: 'prose-volume',
      noteTimestamp: note.timestamp,
      sourceQuote: whole.trim(),
      noteText: text,
      ingredient: assoc,
      baseline,
      proposed: null,
      requiresPrompt: true,
      prompt: tail
        ? `User said "ran out of ${tail.trim()}" — ask how much was actually used.`
        : 'User said "ran out" but didn\'t name an ingredient — ask which one and how much.',
    })
  }

  for (const match of text.matchAll(PROSE_HALF_FULL_RE)) {
    const [whole, qualifier, tail] = match
    const assoc = tail
      ? associateIngredient(tail, ingredients)
      : ({ match: 'none' } as const)
    const baseline = baselineFor(assoc, ingredients)
    // Heuristic only — never apply without confirmation.
    const factor = qualifier.toLowerCase() === 'half' ? 0.5 : 1.0
    const proposed = baseline != null ? Math.round(baseline * factor) : null
    out.push({
      kind: 'prose-volume',
      noteTimestamp: note.timestamp,
      sourceQuote: whole.trim(),
      noteText: text,
      ingredient: assoc,
      baseline,
      proposed,
      requiresPrompt: true,
      prompt: `User said "${whole.trim()}" — ask for the actual gram amount, don't trust the heuristic.`,
    })
  }

  for (const match of text.matchAll(PROSE_DOUBLED_RE)) {
    const [whole, verb, tail] = match
    const assoc = associateIngredient(tail, ingredients)
    const baseline = baselineFor(assoc, ingredients)
    let proposed: number | null = null
    if (baseline != null) {
      switch (verb.toLowerCase()) {
        case 'doubled':
          proposed = baseline * 2
          break
        case 'tripled':
          proposed = baseline * 3
          break
        case 'halved':
          proposed = Math.round(baseline / 2)
          break
        case 'forgot':
          proposed = 0
          break
      }
    }
    out.push({
      kind: 'prose-volume',
      noteTimestamp: note.timestamp,
      sourceQuote: whole.trim(),
      noteText: text,
      ingredient: assoc,
      baseline,
      proposed,
      requiresPrompt: true,
      prompt: `User said "${whole.trim()}" — confirm the literal change before applying.`,
    })
  }

  return out
}

/* ------------------------- Helpers -------------------------------------- */

/** Convert a numeric amount + unit to grams, or null when not convertible
 *  (volumetric units like Tbsp/tsp depend on density and must be confirmed). */
function toGrams(amount: number, unit: string): number | null {
  if (Number.isNaN(amount)) return null
  const u = unit.toLowerCase()
  if (u === 'g' || u === 'gram' || u === 'grams') return amount
  if (u === 'kg') return amount * 1000
  // Density-dependent units never converted silently — user must confirm.
  return null
}

/** Best-effort association of a free-form phrase to a recipe ingredient.
 *  Strategy: exact match (case-insensitive token equality on name or id) →
 *  partial match (substring contains) → ambiguous (multiple partials) →
 *  none. Never returns a silent pick when more than one ingredient could
 *  match (AC #6). */
export function associateIngredient(
  phrase: string,
  ingredients: ParsedIngredient[]
): IngredientAssociation {
  if (!phrase) return { match: 'none' }
  const needle = phrase.trim().toLowerCase().replace(/[.,;:!?]+$/, '')
  if (!needle) return { match: 'none' }

  // Exact: needle equals ingredient.name (lowercased) OR the id's spaced form
  // when the id contains hyphens (e.g. id='bread-flour' → 'bread flour').
  // Bare-id equality is NOT exact: ids are shortcuts (e.g. id='flour' for
  // name='bread flour'). Treating `flour` as exact would silently pick the
  // wrong ingredient when the user's word was a partial of the full name.
  const exact = ingredients.find(
    ing =>
      ing.name.toLowerCase() === needle ||
      (ing.id.includes('-') && ing.id.toLowerCase().replace(/-/g, ' ') === needle)
  )
  if (exact) {
    // Ambiguity check: if more than one ingredient is plausibly the same
    // thing (name equals phrase OR begins with `${phrase} `), surface as
    // ambiguous rather than silently picking the first match. (Mozzarella Rule.)
    const peers = ingredients.filter(
      ing =>
        ing.name.toLowerCase() === needle ||
        ing.name.toLowerCase().startsWith(`${needle} `)
    )
    if (peers.length > 1) {
      return {
        match: 'ambiguous',
        candidates: peers.map(p => ({ id: p.id, name: p.name })),
      }
    }
    return { match: 'exact', id: exact.id, name: exact.name }
  }

  // Substring: ingredient name is contained in needle, OR needle is contained
  // in ingredient name. Score by length to prefer specific over generic.
  const partials = ingredients.filter(
    ing =>
      needle.includes(ing.name.toLowerCase()) ||
      ing.name.toLowerCase().includes(needle)
  )
  if (partials.length === 1) {
    return { match: 'partial', id: partials[0]!.id, name: partials[0]!.name }
  }
  if (partials.length > 1) {
    return {
      match: 'ambiguous',
      candidates: partials.map(p => ({ id: p.id, name: p.name })),
    }
  }
  return { match: 'none' }
}

function baselineFor(
  assoc: IngredientAssociation,
  ingredients: ParsedIngredient[]
): number | null {
  if (assoc.match === 'exact' || assoc.match === 'partial') {
    const ing = ingredients.find(i => i.id === assoc.id)
    return ing?.total ?? null
  }
  return null
}

function promptForAssociation(
  assoc: IngredientAssociation,
  phrase: string
): string {
  if (assoc.match === 'partial') {
    return `Partial match — confirm "${phrase}" → "${assoc.name}" or pick a different ingredient.`
  }
  if (assoc.match === 'ambiguous') {
    const names = assoc.candidates.map(c => c.name).join(', ')
    return `Ambiguous — "${phrase}" could be: ${names}. Ask user to choose.`
  }
  return `No matching ingredient for "${phrase}" — ask user to choose one.`
}

/** Heuristic guard: skip "100°F" / "208°F internal" / "76°F DDT" type matches
 *  that look like temps or stat readings rather than ingredient quantities.
 *  Forward count-quantity regex is greedy; if the trailing phrase looks like
 *  "internal", "temp", "ddt", etc., we should not treat it as an ingredient. */
function looksLikeStat(_match: string, text: string, index: number): boolean {
  // Look ~6 chars before the index for a degree marker indicating temperature.
  const before = text.slice(Math.max(0, index - 6), index)
  if (/°/.test(before)) return true
  return false
}
