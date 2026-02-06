<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRecipe } from '@/composables/useRecipe'

const emit = defineEmits<{
  select: [recipeId: string]
}>()

const { families, recipeList, currentRecipeId } = useRecipe()

// Cache for cook_log status - fetched lazily
const cookLogCache = ref<Record<string, boolean>>({})

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

// Check if recipe has cook_log
async function checkCookLog(recipeId: string): Promise<boolean> {
  if (recipeId in cookLogCache.value) {
    return cookLogCache.value[recipeId]
  }

  const entry = recipeList.value.find(r => r.id === recipeId)
  if (!entry) return false

  try {
    const response = await fetch(`/recipes/${entry.file}`)
    const recipe = await response.json()
    const hasCookLog = Array.isArray(recipe.cook_log) && recipe.cook_log.length > 0
    cookLogCache.value[recipeId] = hasCookLog
    return hasCookLog
  } catch {
    return false
  }
}

// Load cook_log status for all recipes on mount
onMounted(async () => {
  const allRecipeIds = recipeList.value.map(r => r.id)
  await Promise.all(allRecipeIds.map(id => checkCookLog(id)))
})

function hasCookLog(recipeId: string): boolean {
  return cookLogCache.value[recipeId] ?? false
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
  border: 2px solid #e8e4dc;
  background: #faf9f7;
  color: #1a1816;
  cursor: pointer;
  transition: all 0.15s ease;
}

.variant-chip:hover {
  border-color: #a65d45;
}

.variant-chip.active {
  background: #a65d45;
  border-color: #a65d45;
  color: white;
}

.cook-log-indicator {
  color: #a65d45;
  font-size: 0.75rem;
}

.variant-chip.active .cook-log-indicator {
  color: white;
}
</style>
