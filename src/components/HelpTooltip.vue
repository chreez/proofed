<script lang="ts">
/**
 * Module-scope id counter. Lives in a non-setup <script> block so it is
 * shared across all instances of the component, not re-initialized per
 * instance (which would happen if it were declared inside <script setup>).
 * Each setup() call increments it once via `nextHelpTooltipId()`.
 */
let __helpTooltipCounter = 0
export function nextHelpTooltipId(): string {
  __helpTooltipCounter += 1
  return `help-tooltip-${__helpTooltipCounter}`
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

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
 * The popover itself is rendered via `<Teleport to="body">` once opened, so
 * scroll-isolated parents (e.g. /pricing's overflow:hidden viewport box)
 * cannot clip it. Positioning is computed from the trigger's bounding rect
 * on open, scroll, and resize.
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

// Stable, unique id per instance for ARIA wiring. Allocated once at setup
// time (counter lives in the non-setup <script> module-scope block above).
const __autoId = nextHelpTooltipId()
const tooltipId = computed(() => props.id ?? __autoId)

const open = ref(false)
const hovered = ref(false)
const focused = ref(false)
const tappedOpen = ref(false)

const wrapper = ref<HTMLElement | null>(null)
const popover = ref<HTMLElement | null>(null)

// Position of the teleported popover relative to the document. Computed from
// the trigger's bounding rect plus the current scroll offsets, so it stays
// glued to the trigger even when the page (or an interior scroller) moves.
const popoverTop = ref(0)
const popoverLeft = ref(0)

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
 * Click on the trigger (mouse or touch) — close the tooltip immediately.
 * Without this, clicking a button leaves the tooltip stuck because the mouse
 * stays over the trigger (no mouseleave) and focus often remains (no blur).
 * Clearing all open-state flags ensures it stays closed until the pointer
 * actually moves out and back in, or refocus, etc.
 */
function onClick(): void {
  if (!open.value) return
  open.value = false
  hovered.value = false
  tappedOpen.value = false
  focused.value = false
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
  // Also keep open if the tap landed inside the teleported popover.
  if (target && popover.value && popover.value.contains(target)) return
  tappedOpen.value = false
  maybeHide()
}

/**
 * Recalculate the absolute (page-relative) coordinates of the popover from
 * the trigger's bounding rect. Called on open and on scroll/resize while
 * open. The teleport target is `body`, so coordinates are in page space —
 * `rect.top + window.scrollY`, not just `rect.top`.
 */
function updatePosition(): void {
  if (!wrapper.value) return
  const rect = wrapper.value.getBoundingClientRect()
  popoverTop.value = rect.top + window.scrollY
  popoverLeft.value = rect.left + window.scrollX
  // Width/anchor offsets are handled by the popover's CSS via modifier
  // classes — we only need the trigger's origin here. The popover element
  // uses `transform` + the same align/placement classes to position itself
  // relative to that origin.
}

function onScroll(): void {
  if (open.value) updatePosition()
}

function onResize(): void {
  if (open.value) updatePosition()
}

watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    updatePosition()
  }
})

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', onDocumentPointerdown, true)
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onResize)
}

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onDocumentPointerdown, true)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onScroll, true)
    window.removeEventListener('resize', onResize)
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
    @click="onClick"
  >
    <span class="help-tooltip-trigger" :aria-describedby="tooltipId">
      <slot />
    </span>
    <Teleport to="body">
      <span
        :id="tooltipId"
        ref="popover"
        role="tooltip"
        class="help-tooltip-popover"
        :class="[
          `help-tooltip-popover--align-${align}`,
          `help-tooltip-popover--placement-${placement}`,
          open ? 'help-tooltip-popover--open' : '',
        ]"
        :data-open="open ? 'true' : 'false'"
        :style="{ top: `${popoverTop}px`, left: `${popoverLeft}px` }"
      >{{ text }}</span>
    </Teleport>
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
</style>

<style>
/*
 * The popover lives outside the component's scoped DOM (it's teleported to
 * body), so its styles must be global. Scoped data attributes wouldn't apply
 * through the teleport.
 */
.help-tooltip-popover {
  position: absolute;
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
  z-index: 1000;
  border: 2px solid var(--color-ink);
  border-radius: 0;
  transition: opacity 0.12s ease, transform 0.12s ease;
  /* Default placement: top, centered. Overridden by modifier classes below. */
  transform: translate(-50%, calc(-100% - 4px));
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
.help-tooltip-popover--placement-bottom {
  transform: translate(-50%, 4px);
}

.help-tooltip-popover--placement-bottom::after {
  top: auto;
  bottom: 100%;
  border-top-color: transparent;
  border-bottom-color: var(--color-ink);
}

/* Alignment variants. */
.help-tooltip-popover--align-left {
  transform: translate(0, calc(-100% - 4px));
}

.help-tooltip-popover--align-left::after {
  left: 10px;
  transform: none;
}

.help-tooltip-popover--align-right {
  transform: translate(-100%, calc(-100% - 4px));
}

.help-tooltip-popover--align-right::after {
  left: auto;
  right: 10px;
  transform: none;
}

.help-tooltip-popover--placement-bottom.help-tooltip-popover--align-left {
  transform: translate(0, 4px);
}

.help-tooltip-popover--placement-bottom.help-tooltip-popover--align-right {
  transform: translate(-100%, 4px);
}

/* Open state: fade in + nudge toward the trigger. */
.help-tooltip-popover--open {
  opacity: 1;
  transform: translate(-50%, calc(-100% - 8px));
}

.help-tooltip-popover--open.help-tooltip-popover--placement-bottom {
  transform: translate(-50%, 8px);
}

.help-tooltip-popover--open.help-tooltip-popover--align-left {
  transform: translate(0, calc(-100% - 8px));
}

.help-tooltip-popover--open.help-tooltip-popover--align-right {
  transform: translate(-100%, calc(-100% - 8px));
}

.help-tooltip-popover--open.help-tooltip-popover--placement-bottom.help-tooltip-popover--align-left {
  transform: translate(0, 8px);
}

.help-tooltip-popover--open.help-tooltip-popover--placement-bottom.help-tooltip-popover--align-right {
  transform: translate(-100%, 8px);
}

@media (prefers-reduced-motion: reduce) {
  .help-tooltip-popover {
    transition: opacity 0s;
  }
}
</style>
