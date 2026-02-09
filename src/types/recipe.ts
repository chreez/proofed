export interface RecipeSummary {
  text: string
  mode: 'dictated' | 'auto'
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
}

export interface StateComponent {
  name: string
  amount: string
}

export interface StateNote {
  text: string
  critical?: boolean
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
  step_notes?: Record<string, string>
  next_time?: NextTimeEntry[]
  photos?: CookLogPhoto[]
}

// Recipe manifest with family grouping
export interface RecipeManifest {
  families?: RecipeFamily[]
  recipes: RecipeEntry[]
}

export interface RecipeFamily {
  id: string
  name: string
  variants: RecipeFamilyVariant[]
}

export interface RecipeFamilyVariant {
  id: string
  recipeId: string
  label: string
}

export interface RecipeEntry {
  id: string
  name: string
  file: string
}
