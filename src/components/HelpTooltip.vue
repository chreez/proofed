<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

/**
 * HelpTooltip — accessible tooltip primitive (DRAFT-89 / F43).
 *
 * Wraps a single interactive element and exposes its label on hover, keyboard
 * focus, and touch tap. The popover is dismissed on blur, mouseleave, Escape,
 * or a second tap. The wrapped trigger gets `aria-describedby` linked to the
 * popover so screen readers announce the help text.
 *
 * The container is `<span class="inline-flex">` so it doesn't break layout
 * for inline triggers (badges, icons, computed values). Block-level
 * triggers should set `display: block` on the parent or wrap appropriately.
 *
 * Visual style mirrors the IconButton tooltip: dark ink background, mono
 * 11px text, sharp 2px arrow — matches the proofed. brand language.
 */
const props = withDefaults(
  defineProps<{
    /** The tooltip body text. Required. */
    text: string
    /** Horizontal alignment of the popover relative to the trigger. */
    align?: 'left' | 'right' | 'center'
    /** Whether the popover sits above or below the trigger. */
    placement?: 'top' | 'bottom'
    /** Optional explicit id for the popover (otherwise auto-generated). */
    id?: string
  }>(),
  {
    align: 'center',
    placement: 'top',
    id: undefined,
  },
)

// Stable, unique id per instance for ARIA wiring.
let __helpTooltipCounter = 0
function nextId(): string {
  __helpTooltipCounter += 1
  return `help-tooltip-${__helpTooltipCounter}`
}
const tooltipId = computed(() => props.id ?? nextId())

const open = ref(false)
const hovered = ref(false)
const focused = ref(false)
const tappedOpen = ref(false)

const wrapper = ref<HTMLElement | null>(null)

function show(): void {
  open.value = true
}

function maybeHide(): void {
  // Hide only if no input modality is keeping the tooltip open.
  if (!hovered.value && !focused.value && !tappedOpen.value) {
    open.value = false
  }
}

function onMouseenter(): void {
  hovered.value = true
  show()
}

function onMouseleave(): void {
  hovered.value = false
  maybeHide()
}

function onFocusin(): void {
  focused.value = true
  show()
}

function onFocusout(event: FocusEvent): void {
  // Stay open if focus moved to a child element of the wrapper.
  const next = event.relatedTarget as Node | null
  if (next && wrapper.value && wrapper.value.contains(next)) {
    return
  }
  focused.value = false
  maybeHide()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) {
    open.value = false
    hovered.value = false
    tappedOpen.value = false
    // Keep focused.value as-is — Escape shouldn't blur the trigger.
  }
}

/**
 * Touch tap toggle. Pointer events let us discriminate touch from mouse so
 * we don't double-fire with the synthetic mouseenter that follows a tap.
 */
function onPointerdown(event: PointerEvent): void {
  if (event.pointerType !== 'touch') return
  if (tappedOpen.value) {
    tappedOpen.value = false
    maybeHide()
  } else {
    tappedOpen.value = true
    show()
  }
}

/**
 * Global dismiss: a tap outside the wrapper closes a tap-revealed tooltip.
 * Keeps mobile UX from leaving a stuck popover after scrolling away.
 */
function onDocumentPointerdown(event: PointerEvent): void {
  if (!tappedOpen.value) return
  if (!wrapper.value) return
  const target = event.target as Node | null
  if (target && wrapper.value.contains(target)) return
  tappedOpen.value = false
  maybeHide()
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', onDocumentPointerdown, true)
}

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onDocumentPointerdown, true)
  }
})

// When the trigger text changes mid-display, keep ARIA wiring in sync.
watch(() => props.text, () => {
  // No state change required — `text` is bound directly in the template.
})
</script>

<template>
  <span
    ref="wrapper"
    class="help-tooltip"
    :class="[
      `help-tooltip--align-${align}`,
      `help-tooltip--placement-${placement}`,
      open ? 'help-tooltip--open' : '',
    ]"
    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
    @focusin="onFocusin"
    @focusout="onFocusout"
    @keydown="onKeydown"
    @pointerdown="onPointerdown"
  >
    <span class="help-tooltip-trigger" :aria-describedby="tooltipId">
      <slot />
    </span>
    <span
      :id="tooltipId"
      role="tooltip"
      class="help-tooltip-popover"
      :data-open="open ? 'true' : 'false'"
    >{{ text }}</span>
  </span>
</template>

<style scoped>
.help-tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;
  /* Don't intercept clicks meant for the trigger. */
}

.help-tooltip-trigger {
  display: inline-flex;
  align-items: center;
  /* Inherit everything from the slot; we just need a host for aria-describedby. */
}

.help-tooltip-popover {
  position: absolute;
  /* Default placement: top, centered. Overridden by modifier classes. */
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  background: var(--color-ink);
  color: var(--color-stone-100);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  letter-spacing: 0.02em;
  padding: 4px 8px;
  max-width: 240px;
  white-space: normal;
  pointer-events: none;
  opacity: 0;
  z-index: 60;
  border: 2px solid var(--color-ink);
  border-radius: 0;
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.help-tooltip-popover::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--color-ink);
}

/* Placement: bottom flips arrow + offset. */
.help-tooltip--placement-bottom .help-tooltip-popover {
  bottom: auto;
  top: 100%;
  transform: translateX(-50%) translateY(4px);
}

.help-tooltip--placement-bottom .help-tooltip-popover::after {
  top: auto;
  bottom: 100%;
  border-top-color: transparent;
  border-bottom-color: var(--color-ink);
}

/* Alignment variants. */
.help-tooltip--align-left .help-tooltip-popover {
  left: 0;
  transform: translateY(-4px);
}

.help-tooltip--align-left .help-tooltip-popover::after {
  left: 10px;
  transform: none;
}

.help-tooltip--align-right .help-tooltip-popover {
  left: auto;
  right: 0;
  transform: translateY(-4px);
}

.help-tooltip--align-right .help-tooltip-popover::after {
  left: auto;
  right: 10px;
  transform: none;
}

.help-tooltip--placement-bottom.help-tooltip--align-left .help-tooltip-popover {
  transform: translateY(4px);
}

.help-tooltip--placement-bottom.help-tooltip--align-right .help-tooltip-popover {
  transform: translateY(4px);
}

/* Open state: fade in + nudge toward the trigger. */
.help-tooltip--open .help-tooltip-popover {
  opacity: 1;
  transform: translateX(-50%) translateY(-8px);
}

.help-tooltip--open.help-tooltip--placement-bottom .help-tooltip-popover {
  transform: translateX(-50%) translateY(8px);
}

.help-tooltip--open.help-tooltip--align-left .help-tooltip-popover {
  transform: translateY(-8px);
}

.help-tooltip--open.help-tooltip--align-right .help-tooltip-popover {
  transform: translateY(-8px);
}

.help-tooltip--open.help-tooltip--placement-bottom.help-tooltip--align-left .help-tooltip-popover {
  transform: translateY(8px);
}

.help-tooltip--open.help-tooltip--placement-bottom.help-tooltip--align-right .help-tooltip-popover {
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .help-tooltip-popover {
    transition: opacity 0s;
  }
}
</style>
