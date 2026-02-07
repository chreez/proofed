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
  <div
    v-if="family && family.variants.length > 1"
    class="flex gap-1 mb-4 border-b-2 border-stone-200"
  >
    <button
      v-for="variant in family.variants"
      :key="variant.id"
      class="font-mono cursor-pointer border-b-2 transition-colors bg-transparent px-4 py-2 text-sm"
      :class="[
        variant.recipeId === currentRecipeId
          ? 'border-accent text-ink font-medium -mb-0.5'
          : 'border-transparent text-stone-400 hover:text-ink'
      ]"
      @click="handleTabClick(variant.recipeId)"
    >
      {{ variant.label }}
    </button>
  </div>
</template>
