<script setup lang="ts">
import type { ChangeLogEntry } from '@/types/recipe'

defineProps<{
  changeLog: ChangeLogEntry[]
  currentVersion: string
}>()
</script>

<template>
  <section>
    <h3 class="card-title mb-4 pb-2 border-b-2 border-stone-200">
      Version History
    </h3>

    <div class="relative pl-6">
      <!-- Vertical connecting line -->
      <div class="absolute left-[9px] top-0 bottom-0 w-0.5 bg-stone-200" />

      <!-- Timeline entries -->
      <div
        v-for="entry in changeLog"
        :key="entry.version"
        class="relative pb-4 last:pb-0"
      >
        <!-- Dot indicator -->
        <div
          class="absolute -left-6 w-5 h-5 flex items-center justify-center top-0"
        >
          <div
            class="w-2 h-2 rounded-full"
            :class="entry.version === currentVersion ? 'bg-success' : 'bg-accent'"
          />
        </div>

        <!-- Version + date -->
        <div class="flex items-baseline leading-5">
          <span class="font-semibold text-sm">{{ entry.version }}</span>
          <span class="text-xs text-muted ml-2">{{ entry.date }}</span>
        </div>

        <!-- Summary -->
        <p class="text-sm text-stone-600 mt-1">{{ entry.summary }}</p>
      </div>
    </div>
  </section>
</template>
