export interface RecipeSummary {
  text: string
  mode: 'dictated' | 'auto'
}

export interface ReheatMethod {
  method: string
  detail: string
  source: 'user' | 'agent'
}

export interface Reheat {
  methods: ReheatMethod[]
}

export interface Recipe {
  meta: RecipeMeta
  config: RecipeConfig
  vessels: Vessel[]
  stages: Stage[]
  states: RecipeState[]
  version?: string
  summary?: RecipeSummary
  change_log?: ChangeLogEntry[]
  cook_log?: CookLogEntry[]
  nutrition?: RecipeNutrition
  research?: Research
  reheat?: Reheat
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

export interface RecipeMeta {
  name: string
  source?: RecipeSource
  yields: string
  total_time: string
  description?: string
}

export interface RecipeConfig {
  early_check_percent: number
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

export interface StateNote {
  text: string
  critical?: boolean
  source?: 'user' | 'agent'
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
}

// Cook log with step-specific notes
export interface CookLogEntry {
  date: string
  version: string
  notes: string[]
  summary?: string
  step_notes?: Record<string, string>
  next_time?: NextTimeEntry[]
  photos?: CookLogPhoto[]
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
  entries: Record<string, ScratchpadEntry[]>
  generalNotes: ScratchpadEntry[]
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
