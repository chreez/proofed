<script setup lang="ts">
defineProps<{
  id: string
  label: string
  checked: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <div>
    <button
      @click="emit('toggle')"
      class="checkbox-item w-full text-left"
    >
      <span
        class="w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors"
        :class="checked ? 'bg-ink border-ink text-white' : 'border-ink'"
      >
        <span v-if="checked" class="text-xs">✓</span>
      </span>
      <span class="text-body" :class="{ 'checked': checked }">{{ label }}</span>
    </button>
    <slot name="detail" />
  </div>
</template>
