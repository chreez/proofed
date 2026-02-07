<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  tooltip: string
  size?: 'sm' | 'md'
  tooltipAlign?: 'center' | 'right'
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const showFeedback = ref(false)
const feedbackLabel = ref('')
const spinning = ref(false)

function flashCopied(label = 'Copied!'): void {
  feedbackLabel.value = label
  showFeedback.value = true
  setTimeout(() => {
    showFeedback.value = false
  }, 2000)
}

function flashSpin(): void {
  spinning.value = true
  setTimeout(() => {
    spinning.value = false
  }, 400)
}

function handleClick(event: MouseEvent): void {
  emit('click', event)
}

defineExpose({ flashCopied, flashSpin })
</script>

<template>
  <div class="icon-btn-wrap">
    <button
      class="icon-btn"
      :class="[
        showFeedback ? 'icon-btn--feedback' : '',
        spinning ? 'icon-btn--spin' : '',
        size === 'sm' ? 'icon-btn--sm' : ''
      ]"
      :title="tooltip"
      @click="handleClick"
    >
      <slot v-if="!showFeedback" />
      <slot v-else name="feedback" />
    </button>
    <span
      class="icon-tooltip"
      :class="[
        showFeedback ? 'icon-tooltip--feedback' : '',
        tooltipAlign === 'right' ? 'icon-tooltip--right' : ''
      ]"
    >{{ showFeedback ? feedbackLabel : tooltip }}</span>
  </div>
</template>

<style scoped>
.icon-btn-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  border-radius: 0;
  padding: 0;
}

.icon-btn--sm {
  width: 36px;
  height: 36px;
}

.icon-btn:hover {
  background: var(--color-stone-200);
}

.icon-btn:active {
  background: var(--color-stone-300);
}

.icon-btn :deep(svg) {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.icon-btn--sm :deep(svg) {
  width: 14px;
  height: 14px;
}

.icon-btn--feedback {
  color: var(--color-accent);
}

.icon-btn--spin :deep(svg) {
  transition: transform 0.4s ease;
  transform: rotate(-360deg);
}

/* Tooltip */
.icon-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(8px);
  background: var(--color-ink);
  color: var(--color-stone-100);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.02em;
  padding: 4px 8px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 50;
  border-radius: 0;
}

/* Arrow */
.icon-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-bottom-color: var(--color-ink);
}

.icon-tooltip--right {
  left: auto;
  right: 0;
  transform: translateY(8px);
}

.icon-tooltip--right::before {
  left: auto;
  right: 10px;
  transform: none;
}

.icon-btn-wrap:hover .icon-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(4px);
}

.icon-btn-wrap:hover .icon-tooltip--right {
  transform: translateY(4px);
}

/* Feedback tooltip (always visible, accent bg) */
.icon-tooltip--feedback {
  background: var(--color-accent);
  opacity: 1;
  transform: translateX(-50%) translateY(4px);
}

.icon-tooltip--feedback.icon-tooltip--right {
  transform: translateY(4px);
}

.icon-tooltip--feedback::before {
  border-bottom-color: var(--color-accent);
}
</style>
