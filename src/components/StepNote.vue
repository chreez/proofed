<script setup lang="ts">
defineProps<{
  note: string
  date: string
  sessionLink?: string
}>()
</script>

<template>
  <div class="voice-human mt-2">
    <div class="voice-human-label">
      // My Note
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
