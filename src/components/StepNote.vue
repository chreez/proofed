<script setup lang="ts">
defineProps<{
  note: string
  date: string
  sessionLink?: string
}>()
</script>

<template>
  <div class="mt-2 p-3 bg-amber-50/50 border-l-3 border-amber-400">
    <div class="text-xs uppercase font-semibold text-amber-700/80 mb-1">
      📝 MY NOTE
    </div>
    <div class="text-sm text-stone-700">
      {{ note }}
    </div>
    <div class="text-xs text-muted mt-2 flex justify-between">
      <span>{{ date }}</span>
      <a
        v-if="sessionLink"
        :href="sessionLink"
        class="text-accent hover:underline"
      >
        View full session
      </a>
    </div>
  </div>
</template>
