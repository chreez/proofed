<script setup lang="ts">
import { computed } from 'vue'
import { deriveAllergens } from '@/composables/useAllergens'
import type { Recipe } from '@/types/recipe'

const props = defineProps<{
  recipe: Recipe
}>()

const allergens = computed(() => deriveAllergens(props.recipe))
const hasAllergens = computed(() => allergens.value.length > 0)
const allergenText = computed(() => {
  if (!hasAllergens.value) return ''
  return `Contains: ${allergens.value.join(', ')}.`
})
</script>

<template>
  <div v-if="hasAllergens" class="allergen-declaration">
    <p class="allergen-text">{{ allergenText }}</p>
  </div>
</template>

<style scoped>
.allergen-declaration {
  background: var(--color-stone-100);
  border: 2px solid var(--color-stone-300);
  padding: 0.75rem 1rem;
  margin-top: 1rem;
}

.allergen-text {
  font-family: Inter, system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
}

/* Print-optimized styling */
@media print {
  .allergen-declaration {
    background: white;
    border: 2px solid black;
    padding: 0.75rem 1rem;
    margin-top: 1rem;
    page-break-inside: avoid;
  }

  .allergen-text {
    font-size: 11pt;
    font-weight: bold;
    color: black;
  }
}
</style>
