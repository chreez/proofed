export interface Recipe {
  meta: RecipeMeta
  config: RecipeConfig
  vessels: Vessel[]
  stages: Stage[]
  states: RecipeState[]
  version?: string
  change_log?: ChangeLogEntry[]
  cook_log?: CookLogEntry[]
  nutrition?: RecipeNutrition
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

export interface RecipeMeta {
  name: string
  source?: string
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

// Version tracking
export interface ChangeLogEntry {
  version: string
  date: string
  summary: string
}

// Cook log with step-specific notes
export interface CookLogEntry {
  date: string
  version: string
  notes: string[]
  step_notes?: Record<string, string>
  next_time?: string[]
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
