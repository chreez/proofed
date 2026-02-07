<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTechniques } from '@/composables/useTechniques'
import TempText from '@/components/TempText.vue'

const props = defineProps<{
  text: string
}>()

const { parseTextWithTechniques } = useTechniques()
const activeTooltip = ref<string | null>(null)

const parts = computed(() => parseTextWithTechniques(props.text))

function showTooltip(keyword: string) {
  activeTooltip.value = keyword
}

function hideTooltip() {
  activeTooltip.value = null
}
</script>

<template>
  <span class="technique-text">
    <template v-for="(part, index) in parts" :key="index">
      <TempText v-if="part.type === 'text'" :text="part.content" />
      <span
        v-else
        class="technique-keyword"
        @mouseenter="showTooltip(part.content)"
        @mouseleave="hideTooltip"
        @focus="showTooltip(part.content)"
        @blur="hideTooltip"
        tabindex="0"
      >
        {{ part.content }}
        <span
          v-if="activeTooltip === part.content && part.technique"
          class="technique-tooltip"
        >
          <span class="tooltip-title">{{ part.technique.title }}</span>
          <span class="tooltip-desc">{{ part.technique.description }}</span>
        </span>
      </span>
    </template>
  </span>
</template>

<style scoped>
.technique-keyword {
  color: var(--color-accent); /* accent */
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
  cursor: help;
  position: relative;
}

.technique-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-ink); /* ink */
  color: var(--color-stone-50);
  padding: 12px 16px;
  border-radius: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  width: 260px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-decoration: none;
}

.technique-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--color-ink); /* ink */
}

.tooltip-title {
  font-weight: 600;
  color: var(--color-accent); /* accent */
}

.tooltip-desc {
  color: var(--color-stone-400); /* muted on ink bg */
}
</style>
