<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="border-t-2 border-stone-200 mt-12 py-6 px-4">
    <div class="max-w-3xl mx-auto flex flex-col items-center gap-3 md:flex-row md:justify-between text-xs text-stone-400">
      <span class="font-mono">proofed<span class="text-accent">.</span> &copy; 2026 Chris Palmer</span>
      <div class="flex items-center gap-4">
        <RouterLink to="/about" class="text-stone-400 hover:text-ink transition-colors">About</RouterLink>
        <a
          href="https://github.com/chreez/proofed"
          target="_blank"
          rel="noopener noreferrer"
          class="text-stone-400 hover:text-ink transition-colors"
          aria-label="GitHub"
        >
          <div class="i-carbon-logo-github text-base" />
        </a>
        <a
          href="https://instagram.com/rhythm_hawk"
          target="_blank"
          rel="noopener noreferrer"
          class="text-stone-400 hover:text-ink transition-colors"
          aria-label="Instagram"
        >
          <div class="i-carbon-logo-instagram text-base" />
        </a>
      </div>
    </div>
  </footer>
</template>
