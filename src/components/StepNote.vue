<script setup lang="ts">
defineProps<{
  note: string
  date: string
  sessionLink?: string
}>()
</script>

<template>
  <div class="mt-2 p-3 bg-warning-tint border-l-3 border-warning">
    <div class="text-xs uppercase font-semibold text-warning mb-1">
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
