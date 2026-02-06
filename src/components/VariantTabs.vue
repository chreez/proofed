<script setup lang="ts">
import { computed } from 'vue'
import { useRecipe } from '@/composables/useRecipe'

const props = defineProps<{
  familyId: string
}>()

const emit = defineEmits<{
  select: [recipeId: string]
}>()

const { families, currentRecipeId } = useRecipe()

const family = computed(() =>
  families.value.find(f => f.id === props.familyId) ?? null
)

function handleTabClick(recipeId: string): void {
  if (recipeId !== currentRecipeId.value) {
    emit('select', recipeId)
  }
}
</script>

<template>
  <div v-if="family && family.variants.length > 1" class="flex border-b-2 border-stone-200 mb-4">
    <button
      v-for="variant in family.variants"
      :key="variant.id"
      class="px-4 py-2 text-sm cursor-pointer border-b-2 transition-colors"
      :class="[
        variant.recipeId === currentRecipeId
          ? 'border-accent font-medium -mb-0.5'
          : 'border-transparent hover:bg-stone-100'
      ]"
      @click="handleTabClick(variant.recipeId)"
    >
      {{ variant.label }}
    </button>
  </div>
</template>
