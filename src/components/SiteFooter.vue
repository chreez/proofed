<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  sticky?: boolean
}>()

const expanded = ref(false)
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// Watch for ref binding (fires after template renders, unlike onMounted with fragments)
watch(sentinelRef, (el) => {
  observer?.disconnect()
  observer = null
  if (!el || !props.sticky || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    ([entry]) => {
      expanded.value = entry.isIntersecting
    },
    { threshold: 0 }
  )
  observer.observe(el)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <!-- Sticky mode: sentinel + compact/expanded footer -->
  <template v-if="sticky">
    <div ref="sentinelRef" class="footer-sentinel" aria-hidden="true" />

    <footer class="site-footer" :class="{ 'footer-expanded': expanded }">
      <div class="footer-inner">
        <span class="footer-brand font-mono">proofed<span class="text-accent">.</span></span>

        <div class="footer-links">
          <RouterLink to="/about" class="footer-link">About</RouterLink>
          <a href="https://github.com/chreez/proofed" target="_blank" rel="noopener noreferrer" class="footer-link" aria-label="GitHub">
            <div class="i-carbon-logo-github text-base" />
          </a>
          <a href="https://instagram.com/rhythm_hawk" target="_blank" rel="noopener noreferrer" class="footer-link" aria-label="Instagram">
            <div class="i-carbon-logo-instagram text-base" />
          </a>
        </div>

        <span class="footer-copy">&copy; 2026 Chris Palmer</span>
      </div>
    </footer>
  </template>

  <!-- Static mode: original full footer -->
  <footer v-else class="border-t-2 border-stone-200 mt-12 py-6 px-4">
    <div class="max-w-3xl mx-auto flex flex-col items-center gap-3 md:flex-row md:justify-between text-xs text-stone-400">
      <span class="font-mono">proofed<span class="text-accent">.</span> &copy; 2026 Chris Palmer</span>
      <div class="flex items-center gap-4">
        <RouterLink to="/about" class="text-stone-400 hover:text-ink transition-colors">About</RouterLink>
        <a href="https://github.com/chreez/proofed" target="_blank" rel="noopener noreferrer" class="text-stone-400 hover:text-ink transition-colors" aria-label="GitHub">
          <div class="i-carbon-logo-github text-base" />
        </a>
        <a href="https://instagram.com/rhythm_hawk" target="_blank" rel="noopener noreferrer" class="text-stone-400 hover:text-ink transition-colors" aria-label="Instagram">
          <div class="i-carbon-logo-instagram text-base" />
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-sentinel {
  height: 1px;
  margin-top: -1px;
  pointer-events: none;
}

.site-footer {
  position: sticky;
  bottom: 0;
  z-index: 5;
  background: var(--color-stone-200);
  border-top: 2px solid var(--color-stone-300);
  overflow: hidden;
  transition: all 250ms ease-out;
}

.footer-inner {
  max-width: 48rem;
  margin: 0 auto;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-stone-400);
  transition: padding 250ms ease-out;
}

.footer-brand {
  font-size: 0.75rem;
  color: var(--color-stone-500);
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.footer-link {
  color: var(--color-stone-400);
  transition: color 150ms ease;
  text-decoration: none;
}

.footer-link:hover {
  color: var(--color-ink);
}

.footer-copy {
  font-size: 0.6875rem;
  color: var(--color-stone-400);
  opacity: 0;
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: opacity 200ms ease-out, max-width 250ms ease-out;
}

.footer-expanded {
  border-top-color: var(--color-stone-200);
}

.footer-expanded .footer-inner {
  padding: 1.5rem 1rem;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.footer-expanded .footer-copy {
  opacity: 1;
  max-width: 15rem;
}

.footer-expanded .footer-links {
  margin-left: 0;
}

@media (max-width: 480px) {
  .footer-expanded .footer-inner {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-footer,
  .footer-inner,
  .footer-copy {
    transition: none;
  }
}
</style>
