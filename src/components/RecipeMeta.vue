<script setup lang="ts">
import type { RecipeMeta } from '@/types/recipe'

defineProps<{
  meta: RecipeMeta
}>()
</script>

<template>
  <div class="card">
    <h2 class="text-2xl text-heading mb-2">{{ meta.name }}</h2>
    <div class="flex flex-wrap gap-4 text-muted">
      <span v-if="meta.source">{{ meta.source }}</span>
      <span>{{ meta.yields }}</span>
      <span>{{ meta.total_time }}</span>
    </div>
  </div>
</template>
