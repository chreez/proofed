import { ref, computed } from 'vue'
import type { Recipe, RecipeManifest } from '@/types/recipe'

const manifest = ref<RecipeManifest | null>(null)
const currentRecipe = ref<Recipe | null>(null)
const currentRecipeId = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useRecipe() {
  const recipeList = computed(() => manifest.value?.recipes ?? [])
  const hasRecipe = computed(() => currentRecipe.value !== null)

  async function loadManifest() {
    try {
      const response = await fetch('/recipes/index.json')
      manifest.value = await response.json()
    } catch (e) {
      error.value = 'Failed to load recipe list'
    }
  }

  async function loadRecipe(recipeId: string) {
    loading.value = true
    error.value = null

    try {
      const entry = manifest.value?.recipes.find(r => r.id === recipeId)
      if (!entry) throw new Error('Recipe not found')

      const response = await fetch(`/recipes/${entry.file}`)
      if (!response.ok) throw new Error('Failed to fetch recipe')

      currentRecipe.value = await response.json()
      currentRecipeId.value = recipeId
      localStorage.setItem('last-recipe-id', recipeId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      currentRecipe.value = null
    } finally {
      loading.value = false
    }
  }

  async function restoreLastRecipe() {
    const lastId = localStorage.getItem('last-recipe-id')
    if (lastId && manifest.value?.recipes.some(r => r.id === lastId)) {
      await loadRecipe(lastId)
    } else if (manifest.value?.recipes.length) {
      await loadRecipe(manifest.value.recipes[0].id)
    }
  }

  return {
    manifest,
    currentRecipe,
    currentRecipeId,
    loading,
    error,
    recipeList,
    hasRecipe,
    loadManifest,
    loadRecipe,
    restoreLastRecipe
  }
}
