<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRecipe } from '@/composables/useRecipe'

const emit = defineEmits<{
  select: [recipeId: string]
}>()

const { families, recipeList, currentRecipeId } = useRecipe()

// Cache for cook_log count per recipe
const bakeCountCache = ref<Record<string, number>>({})

// Get all recipe IDs that are in families
const recipesInFamilies = computed(() => {
  const ids = new Set<string>()
  families.value.forEach(family => {
    family.variants.forEach(variant => {
      ids.add(variant.recipeId)
    })
  })
  return ids
})

// Recipes not in any family
const otherRecipes = computed(() =>
  recipeList.value.filter(recipe => !recipesInFamilies.value.has(recipe.id))
)

// Fetch cook_log count for a recipe
async function fetchBakeCount(recipeId: string): Promise<number> {
  if (recipeId in bakeCountCache.value) {
    return bakeCountCache.value[recipeId]
  }

  const entry = recipeList.value.find(r => r.id === recipeId)
  if (!entry) return 0

  try {
    const response = await fetch(`/recipes/${entry.file}`)
    const recipe = await response.json()
    const count = Array.isArray(recipe.cook_log) ? recipe.cook_log.length : 0
    bakeCountCache.value[recipeId] = count
    return count
  } catch {
    return 0
  }
}

// Load bake counts when recipe list becomes available
watch(recipeList, async (list) => {
  if (!list.length) return
  await Promise.all(list.map(r => fetchBakeCount(r.id)))
}, { immediate: true })

function bakeCount(recipeId: string): number {
  return bakeCountCache.value[recipeId] ?? 0
}

// Family aggregate: sum cook_log entries from all variants
function familyBakeCount(familyId: string): number {
  const family = families.value.find(f => f.id === familyId)
  if (!family) return 0
  return family.variants.reduce((sum, v) => sum + bakeCount(v.recipeId), 0)
}

function hasCookLog(recipeId: string): boolean {
  return bakeCount(recipeId) > 0
}

function bakeLabel(count: number): string {
  return count === 1 ? '1 bake' : `${count} bakes`
}

function isActive(recipeId: string): boolean {
  return currentRecipeId.value === recipeId
}

function selectRecipe(recipeId: string): void {
  emit('select', recipeId)
}
</script>

<template>
  <div class="recipe-index">
    <!-- Families -->
    <div v-for="family in families" :key="family.id" class="mb-6">
      <h3 class="font-mono text-sm text-ink border-l-3 border-accent pl-3 mb-3">
        {{ family.name }}
        <span
          v-if="familyBakeCount(family.id) > 0"
          class="text-stone-400 font-normal"
        > · {{ bakeLabel(familyBakeCount(family.id)) }}</span>
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="variant in family.variants"
          :key="variant.id"
          @click="selectRecipe(variant.recipeId)"
          class="variant-chip"
          :class="{ active: isActive(variant.recipeId) }"
        >
          <span>{{ variant.label }}</span>
          <span v-if="hasCookLog(variant.recipeId)" class="cook-log-indicator">✦</span>
        </button>
      </div>
    </div>

    <!-- Other Recipes (not in any family) -->
    <div v-if="otherRecipes.length > 0" class="mb-6">
      <h3 class="font-mono text-sm text-muted border-l-3 border-stone-300 pl-3 mb-3">
        Other Recipes
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="recipe in otherRecipes"
          :key="recipe.id"
          @click="selectRecipe(recipe.id)"
          class="variant-chip"
          :class="{ active: isActive(recipe.id) }"
        >
          <span>{{ recipe.name }}</span>
          <span v-if="hasCookLog(recipe.id)" class="cook-log-indicator">✦</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.variant-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border: 2px solid var(--color-stone-200); /* stone-200 */
  background: var(--color-stone-50); /* stone-50 */
  color: var(--color-ink); /* ink */
  cursor: pointer;
  transition: all 0.15s ease;
}

.variant-chip:hover {
  border-color: var(--color-accent); /* accent */
}

.variant-chip.active {
  background: var(--color-accent); /* accent */
  border-color: var(--color-accent); /* accent */
  color: white;
}

.cook-log-indicator {
  color: var(--color-accent); /* accent */
  font-size: 0.75rem;
}

.variant-chip.active .cook-log-indicator {
  color: white;
}
</style>
