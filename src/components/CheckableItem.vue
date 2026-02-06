<script setup lang="ts">
import TechniqueText from '@/components/TechniqueText.vue'

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
    <label
      class="checkbox-item w-full text-left cursor-pointer"
    >
      <input
        type="checkbox"
        :checked="checked"
        @change="emit('toggle')"
        class="w-4 h-4 flex-shrink-0"
        style="accent-color: #a65d45;"
      >
      <span class="text-body" :class="{ 'checked': checked }">
        <TechniqueText :text="label" />
      </span>
    </label>
    <slot name="detail" />
  </div>
</template>
