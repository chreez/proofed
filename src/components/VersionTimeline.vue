<script setup lang="ts">
import type { ChangeLogEntry } from '@/types/recipe'

defineProps<{
  changeLog: ChangeLogEntry[]
  currentVersion: string
}>()
</script>

<template>
  <section>
    <h3 class="font-semibold text-lg mb-4 pb-2 border-b border-stone-200">
      Version History
    </h3>

    <div class="relative pl-4">
      <!-- Vertical connecting line -->
      <div class="absolute left-1 top-0 bottom-0 w-0.5 bg-stone-200" />

      <!-- Timeline entries -->
      <div
        v-for="entry in changeLog"
        :key="entry.version"
        class="relative pb-4 last:pb-0"
      >
        <!-- Dot indicator -->
        <div
          class="absolute -left-3 top-1.5 w-2 h-2 rounded-full"
          :class="entry.version === currentVersion ? 'bg-green-500' : 'bg-accent'"
        />

        <!-- Version + date -->
        <div class="flex items-baseline">
          <span class="font-semibold text-sm">{{ entry.version }}</span>
          <span class="text-xs text-muted ml-2">{{ entry.date }}</span>
        </div>

        <!-- Summary -->
        <p class="text-sm text-stone-600 mt-1">{{ entry.summary }}</p>
      </div>
    </div>
  </section>
</template>
