export interface Recipe {
  meta: RecipeMeta
  config: RecipeConfig
  vessels: Vessel[]
  stages: Stage[]
  states: RecipeState[]
}

export interface RecipeMeta {
  name: string
  source?: string
  yields: string
  total_time: string
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
}

export interface StateComponent {
  name: string
  amount: string
}

export interface StateNote {
  text: string
  critical?: boolean
}

export interface RecipeManifest {
  recipes: RecipeEntry[]
}

export interface RecipeEntry {
  id: string
  name: string
  file: string
}
