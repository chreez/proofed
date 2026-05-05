export interface RecipeSummary {
  text: string
  mode: 'dictated' | 'auto'
}

export interface ReheatMethod {
  method: string
  detail: string
  source: 'user' | 'agent'
  reference?: string
}

export interface Reheat {
  methods: ReheatMethod[]
}

export interface ScalingIngredient {
  id: string
  behavior: 'linear' | 'non_linear' | 'fixed'
  note?: string
}

export interface Scaling {
  tested_range: {
    min: number
    max: number
  }
  ingredients: ScalingIngredient[]
  process_caveats: string[]
  researched_date: string
  sources: string[]
}

export interface EstimatedCost {
  total: number
  perServing: number
  servings: number
  items: CookLogCostItem[]
  estimatedAt: string
}

export type TechnicalNoteCategory = 'substitution' | 'hydration' | 'technique' | 'equipment' | 'general'

export interface TechnicalNote {
  title: string
  text: string
  category?: TechnicalNoteCategory
}

export interface Recipe {
  meta: RecipeMeta
  config: RecipeConfig
  vessels: Vessel[]
  stages: Stage[]
  states: RecipeState[]
  version: string
  summary?: RecipeSummary
  change_log?: ChangeLogEntry[]
  cook_log?: CookLogEntry[]
  nutrition?: RecipeNutrition
  research?: Research
  reheat?: Reheat
  bake_defaults?: RecipeBakeDefaults
  scaling?: Scaling
  estimatedCost?: EstimatedCost
  technical_notes?: TechnicalNote[] | null
  experiment?: ExperimentConfig | false
}

/**
 * Recipe-level default bake params. Used as the fallback when a cook log entry
 * has low-confidence bake_stats (data wasn't directly logged by the user).
 * These represent "what the recipe prescribes" at the current recipe version.
 * Historical version snapshots aren't tracked — treat as current baseline.
 */
export interface RecipeBakeDefaults {
  bake_phases?: BakePhase[]
}

export interface NutrientTotals {
  calories: number
  protein: number
  totalFat: number
  saturatedFat: number
  carbohydrates: number
  sugar: number
  fiber: number
  sodium: number
}

export interface IngredientNutrition {
  ingredientId: string
  ingredientName: string
  amount: number
  fdcId?: number
  calories: number
  protein: number
  totalFat: number
  saturatedFat: number
  carbohydrates: number
  sugar: number
  fiber: number
  sodium: number
}

export interface RecipeNutrition {
  servings: number
  servingSize?: string
  calculatedDate: string
  dataSource: string
  totals: NutrientTotals
  perServing: NutrientTotals
  breakdown: IngredientNutrition[]
}

export interface SourcePhoto {
  src: string
  thumb: string
  alt: string
}

export interface RecipeSource {
  name: string
  url?: string
  type?: 'original' | 'adapted' | 'inspired'
  author?: string
  accessed?: string
  photos?: SourcePhoto[]
  photoCredit?: string
}

/**
 * Confidence level for ingredient/technique provenance.
 * - high: 5+ independent sources agree on the value
 * - medium: 2-4 sources agree
 * - low: only 1 source (or personal judgment)
 */
export type Confidence = 'high' | 'medium' | 'low'

// Research provenance — traces ingredient and technique decisions back to sources
export interface ResearchTechnique {
  name: string
  sourcedFrom: string
  rationale: string
  confidence?: Confidence
}

export interface Research {
  sources: RecipeSource[]
  techniques: ResearchTechnique[]
  strategy: string
  sourceCount: number
  date: string
}

export interface OutdatedMarker {
  reason: string
  supersededBy?: string
}

export interface RecipeMeta {
  name: string
  source?: RecipeSource
  yields: string
  total_time: string
  description?: string
  allergenOverride?: string[]
  outdated?: OutdatedMarker
}

export interface RecipeStats {
  group: string
  subgroup?: string
  defaultYield: number
  unit: string
  servingsPerItem: number
  servingUnit: string
}

export interface RecipeConfig {
  early_check_percent: number
  stats?: RecipeStats
  bakeStatsSchema?: BakeStatsSchema
}

// Per-bake structured stats (Option A — flat scalars + arrays).
// All fields optional so recipes can omit irrelevant arrays (cookies/pizza
// just skip bulk_ambient_temps, aliquot_rises, etc.).
// Time format: `YYYY-MM-DD - HH:MM` (24-hour) — all times stored as strings.

export interface DoughTemp {
  time: string
  temp_f: number
}

export interface BulkAmbientTemp {
  date: string
  temp_f: number
  note?: string
}

export interface BakePhase {
  stage: 'preheat' | 'covered' | 'uncovered'
  start_time?: string
  temp_f: number
  duration_min: number
}

export interface StretchFold {
  time: string
  type: 'stretch_fold' | 'coil' | 'lamination'
  note?: string
}

export interface AliquotRise {
  time: string
  rise_pct: number
  stage: 'bulk' | 'preshape' | 'final'
  note?: string
}

export interface ProofPhase {
  type: 'bench_rest' | 'cold_retard'
  start?: string
  end?: string
  duration_min?: number
  duration_hours?: number
  note?: string
}

export interface BakeStatsBlock {
  dough_temps?: DoughTemp[]
  bulk_ambient_temps?: BulkAmbientTemp[]
  bake_phases?: BakePhase[]
  stretch_folds?: StretchFold[]
  aliquot_rises?: AliquotRise[]
  proof_phases?: ProofPhase[]
  /** When dough was turned out / preshaped — marks end of bulk fermentation.
   * Format: `YYYY-MM-DD - HH:MM` */
  shape_time?: string
  /**
   * Overall trustworthiness of the stats in this block.
   * - `high`: logged in real-time, reliable
   * - `medium`: mix of logged and recalled, directionally accurate
   * - `low`: recalled or guesstimate — user explicitly flagged as unreliable,
   *   excluded from comparisons
   * - `undefined`: unknown (UI should treat as implicitly medium; older entries
   *   predate this field and should not be rewritten)
   */
  confidence?: 'high' | 'medium' | 'low'
}

// Per-recipe declaration of which BakeStatsBlock fields the recipe tracks.
// Lives on RecipeConfig; per-bake data is stored separately on CookLogEntry
// (wired in PF-177.4).
export interface BakeStatsSchema {
  fields: Array<keyof BakeStatsBlock>
}

export interface Vessel {
  id: string
  name: string
  reuse?: string
}

export interface Stage {
  id: string
  title: string
  gather: GatherSection | null
  states: string[]
}

export interface GatherSection {
  vessels?: string[]
  equipment?: string[]
  ingredients?: Ingredient[]
}

export interface Ingredient {
  id: string
  name: string
  total: number
  unit: string
  breakdown: IngredientBreakdown[] | null
  sourcedFrom?: string
  confidence?: Confidence
  rationale?: string
}

export interface IngredientBreakdown {
  label: string
  amount: number
}

// Scratchpad: reminders configured per step in recipe JSON
export interface StepReminder {
  prompt: string
  type?: 'measurement' | 'observation' | 'rating'
}

export interface RecipeState {
  id: string
  title: string
  direction: string
  duration_min?: number
  timer?: boolean
  parallel?: boolean
  components: StateComponent[] | null
  exit_condition: string
  notes: StateNote[] | null
  technique_url?: string
  reminders?: StepReminder[]
}

export interface StateComponent {
  name: string
  amount: string
}

export type StateNoteTableCellType =
  | 'text'
  | 'number'
  | 'temperature'
  | 'percent'

export interface StateNoteTableHeader {
  label: string
  type?: StateNoteTableCellType
}

export interface StateNoteTable {
  caption?: string
  source?: string
  headers: StateNoteTableHeader[]
  rows: Array<Array<string | number>>
}

export interface StateNote {
  text: string
  critical?: boolean
  source?: 'user' | 'agent'
  table?: StateNoteTable
}

export interface KeyNote {
  text: string
  timestamp?: string  // ISO 8601 datetime
}

/**
 * Unified bake note — one per scratchpad entry or user observation.
 * Replaces fragmented notes[] / key_notes[] / raw_notes with a single
 * timestamp-indexed structure. Raw input is never lost.
 */
export interface BakeNote {
  /** ISO 8601 UTC timestamp from scratchpad capture */
  timestamp: string
  /** Verbatim user text — never edited, never trimmed */
  raw: string
  /** Highlight-worthy observation (surfaces in curated view) */
  notable: boolean
  /** Recipe step this note was captured against */
  stepId?: string
  /** Scratchpad prompt that triggered this note (e.g. "Record dough temperature") */
  prompt?: string
  /** Agent-refined version when different from raw */
  curated?: string
  /** Processing stage context (e.g. "bulk_ferment", "bake", "shaping") */
  processing?: string
}

export interface NextTimeEntry {
  text: string
  source?: string
}

// Version tracking
export interface ChangeLogEntry {
  version: string
  date: string
  summary: string
}

// Cook log photos
export interface CookLogPhoto {
  src: string
  thumb: string
  alt: string
  tag?: 'hero' | 'process' | 'step' | 'exclude'
  name?: string
}

// Cook log with step-specific notes
export interface CookLogCostItem {
  ingredientId: string
  name: string
  sourceType: CostSourceType
  sourceName: string
  amount: number
  unit: string
  cost: number
}

export interface CookLogCost {
  total: number
  perServing: number
  servings: number
  items: CookLogCostItem[]
  note?: string
}

export interface CookLogYield {
  value: number
  unit: string
  notes?: string
}

export interface CookLogEntry {
  date: string
  start_date?: string
  version: string
  /**
   * Full raw prose bake log — the complete record of what the user did
   * during this bake. Source of truth: never trimmed, reworded, or reordered
   * once captured. Rendered verbatim inside the collapsed "Raw notes"
   * disclosure on BakeDetailView, and still surfaced in the Notes section as
   * a fallback when `key_notes` is absent.
   */
  notes: string[]
  /**
   * Curated editorial subset of `notes` — only the narrative lines that are
   * NOT already captured by the structured `bake_stats` chart (timestamps,
   * dough temps, aliquot rises, bake phases, stretch & fold timeline, ambient
   * temps, etc.). Rendered in the main Notes section on BakeDetailView.
   *
   * Semantics on BakeDetailView:
   * - Absent / `undefined`: fall back to rendering full `notes[]` (entry
   *   hasn't been curated yet).
   * - Present and non-empty: render these lines as the Notes section.
   * - Present and empty (`[]`): Notes section renders as silent — used when
   *   every prose line is already captured by the chart and there is no
   *   editorial narrative to preserve.
   */
  key_notes?: KeyNote[]
  summary?: string
  step_notes?: Record<string, string>
  next_time?: NextTimeEntry[]
  photos?: CookLogPhoto[]
  cost?: CookLogCost
  status?: 'in_progress' | 'complete'
  actual_yield?: CookLogYield
  aberration?: boolean
  aberration_note?: string
  /**
   * User-rated outcome of this bake. Set via the Instagram share workflow
   * (PF-234) when the user picks an outcome. Field is absent if the user
   * skipped or never opened the share workflow. Used in the IG caption
   * line 3 outcome segment ("✅ success" / "😐 mid" / "👎 meh" / "💥 failure").
   */
  outcome?: 'failure' | 'meh' | 'mid' | 'success'
  // Structured per-bake stats (PF-177.3 schema). Populated by /bake-log skill
  // (PF-177.6) or backfill (PF-177.7). Optional — existing entries omit it.
  bake_stats?: BakeStatsBlock
  /**
   * @deprecated Use `bake_notes` instead. Retained for backward compat with
   * existing data. New entries should omit this field and write BakeNote[]
   * to `bake_notes`. (PF-216)
   */
  raw_notes?: string
  /** Unified per-note array with timestamps, raw text, and optional agent
   *  curation. Replaces raw_notes + augments notes[]/key_notes[]. (PF-216) */
  bake_notes?: BakeNote[]
  // Outdoor weather conditions on bake day. Populated by /bake-log skill
  // (PF-193.1) or backfill (PF-193.2). Optional — existing entries omit it.
  weather?: BakeWeather
}

// Outdoor weather snapshot for a bake day (PF-193).
// Lives on CookLogEntry, not BakeStatsBlock — weather is environmental
// context, not bake performance data.
export interface BakeWeather {
  location: string
  date: string
  temp_high_f: number
  temp_low_f: number
  humidity_avg_percent: number
  condition: string
  source: 'open-meteo'
}

// Recipe manifest
export interface RecipeManifest {
  recipes: RecipeEntry[]
}

export interface RecipeEntry {
  id: string
  name: string
  file: string
}

// Bake scratchpad — structured note capture during active bakes
export interface ScratchpadEntry {
  stepId: string
  timestamp: string
  type: 'reminder_response' | 'note' | 'rating'
  prompt?: string
  value: string
  rating?: 'good' | 'ok' | 'bad'
}

export interface BakeScratchpad {
  recipeId: string
  bakeDate: string
  multiplier?: number
  entries: Record<string, ScratchpadEntry[]>
  generalNotes: ScratchpadEntry[]
  /** Experiment variation snapshot, if the user exported one during this bake */
  experimentExport?: ExperimentExport
  /**
   * User-rated outcome captured during the bake. Future /bake-log skill will
   * harvest this into the cook_log entry at write time (out of scope for
   * PF-234 — share workflow currently reads scratchpad as resolution step
   * 2 if entry.outcome is missing).
   */
  outcome?: 'failure' | 'meh' | 'mid' | 'success'
}

// HEB cost data — agent-populated product search results
export interface HebProduct {
  name: string
  brand: string
  size: string
  sizeGrams: number
  price: number
  salePrice: number | null
  unitPrice: string
  inStock: boolean
}

export interface HebIngredientResult {
  ingredientId: string
  name: string
  recipeAmount: number
  recipeUnit: string
  products: HebProduct[]
}

export interface HebResultsFile {
  recipeId: string
  date: string
  storeId: number
  ingredients: HebIngredientResult[]
}

// Stored cost rates — proofed-specific pantry staple rates
export interface CostRate {
  name: string
  ratePerGram: number
  sourceProduct: string
  updatedAt: string
}

export interface CostRatesFile {
  updatedAt: string
  source: string
  rates: Record<string, CostRate>
}

// Cost selection — user picks for each ingredient
export type CostSourceType = 'heb' | 'pantry' | 'manual' | 'rate'

export interface CostSelection {
  ingredientId: string
  sourceType: CostSourceType
  // HEB selection
  productIndex?: number
  // Pantry rate
  pantryPurchaseLbs?: number
  pantryPurchasePrice?: number
  pantrySource?: string
  // Manual entry
  manualProductName?: string
  manualPrice?: number
  manualSizeGrams?: number
}

// Bake cost summary — final output
export interface CostLineItem {
  ingredientId: string
  ingredientName: string
  sourceType: CostSourceType
  sourceName: string
  recipeAmount: number
  recipeUnit: string
  packageSize: string
  packagePrice: number
  cost: number
}

export interface BakeCostSummary {
  recipeId: string
  date: string
  costs: CostLineItem[]
  total: number
  perServing: number
  servings: number
}

// ---------------------------------------------------------------------------
// Experiment Tool — real-time ingredient adjustment & derived variable calc
// ---------------------------------------------------------------------------

/** Classification of an ingredient's role in dough for hydration math. */
export type ExperimentRole = 'base_flour' | 'base_liquid' | 'enrichment' | 'inclusion'

/**
 * Per-ingredient configuration for the experiment tool.
 * Declares which ingredients are adjustable via slider and their constraints.
 * Lives on Recipe.experiment.ingredients[].
 */
export interface ExperimentIngredient {
  /** Must match an Ingredient.id in the recipe's gather sections */
  id: string
  /** Ingredient's role in dough formula — drives how hydration is calculated */
  role: ExperimentRole
  /** Default amount (grams) — the recipe's baseline before any adjustment */
  defaultAmount: number
  /** Minimum slider value (grams). Must be >= 0. */
  min: number
  /** Maximum slider value (grams). */
  max: number
  /** Slider step size in grams (e.g., 5 for coarse, 1 for fine) */
  step: number
  /**
   * Water content lookup key. References an item id in water-content.json.
   * If omitted, the experiment tool will attempt to match by ingredient id.
   */
  waterContentId?: string
  /**
   * Override water content percentage (0-100). Use when the lookup table
   * doesn't have a match or the specific product differs from the default.
   * Takes precedence over waterContentId lookup.
   */
  waterContentOverride?: number
}

/**
 * Derived variables the experiment tool can display.
 * Each entry defines a calculation the UI should perform and show.
 */
export interface ExperimentDerived {
  /** Unique id for this derived value */
  id: string
  /** Display label (e.g., "Effective Hydration", "Inclusion Load %") */
  label: string
  /** Unit for display (e.g., "%", "g") */
  unit: string
  /**
   * Calculation type. The UI implements each formula:
   * - effective_hydration: (total water from all sources / total flour) * 100
   * - inclusion_load: (total inclusion weight / total flour) * 100
   * - total_dough_weight: sum of all ingredient amounts
   * - custom: use `formula` field for recipe-specific calculations
   */
  type: 'effective_hydration' | 'inclusion_load' | 'total_dough_weight' | 'custom'
  /** Custom formula expression (only used when type === 'custom') */
  formula?: string
}

/**
 * Top-level experiment configuration block on a Recipe.
 * Defines which ingredients are adjustable and what derived values to show.
 */
export interface ExperimentConfig {
  /** Human-readable description of what this experiment explores */
  description: string
  /** Adjustable ingredients with slider config */
  ingredients: ExperimentIngredient[]
  /** Derived values to calculate and display in real-time */
  derived: ExperimentDerived[]
  /**
   * Whether the experiment tool operates on pre-scaled (recipe baseline)
   * or post-scaled amounts. Default: 'pre_scaled'.
   * - pre_scaled: sliders adjust the 1x recipe amounts; scaling multiplier
   *   is applied after experiment adjustments
   * - post_scaled: sliders adjust already-scaled amounts (user sees final
   *   grams for their batch size)
   */
  scaleMode?: 'pre_scaled' | 'post_scaled'
}

// ---------------------------------------------------------------------------
// Experiment Export — serialized variation for bake-log / scratchpad
// ---------------------------------------------------------------------------

/** A single ingredient adjustment recorded at export time. */
export interface ExperimentAdjustment {
  /** Ingredient id from recipe */
  ingredientId: string
  /** Ingredient display name */
  ingredientName: string
  /** Original recipe amount (grams, at the active scale) */
  originalAmount: number
  /** Adjusted amount (grams) after slider change */
  adjustedAmount: number
  /** Difference in grams (positive = added, negative = reduced) */
  delta: number
}

/** A derived value snapshot at the time of export. */
export interface ExperimentDerivedSnapshot {
  /** Derived value id */
  id: string
  /** Display label */
  label: string
  /** Computed value */
  value: number
  /** Unit */
  unit: string
}

/**
 * Full experiment export — captures a specific variation the user wants to
 * bake. Can be attached to a scratchpad export or referenced in cook_log.
 */
export interface ExperimentExport {
  /** Recipe id */
  recipeId: string
  /** ISO 8601 timestamp of when this variation was exported */
  exportedAt: string
  /** Scaling multiplier active at time of export (1 = unscaled) */
  multiplier: number
  /** Scale mode that was active */
  scaleMode: 'pre_scaled' | 'post_scaled'
  /** All adjustments made (only ingredients that changed from default) */
  adjustments: ExperimentAdjustment[]
  /** Derived values at the moment of export */
  derivedValues: ExperimentDerivedSnapshot[]
  /** Optional user notes about this variation */
  notes?: string
}

// ---------------------------------------------------------------------------
// Water Content Lookup Table — typed schema for public/data/water-content.json
// ---------------------------------------------------------------------------

/** A single ingredient entry in the water content lookup table. */
export interface WaterContentItem {
  id: string
  name: string
  /** Water content as a percentage (0-100) */
  waterPercent: number
  /** Source or note about the data point */
  note: string
  /** Alternative names for fuzzy matching */
  aliases: string[]
}

/** A category grouping in the water content lookup table. */
export interface WaterContentCategory {
  id: string
  name: string
  items: WaterContentItem[]
}

/** Root schema for public/data/water-content.json */
export interface WaterContentTable {
  version: string
  updatedAt: string
  description: string
  sources: string[]
  categories: WaterContentCategory[]
}
