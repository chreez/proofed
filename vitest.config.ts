import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/worktrees/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/vite-env.d.ts', 'src/main.ts', 'src/router/index.ts', 'src/types/recipe.ts'],
      thresholds: {
        global: {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
    globals: true
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  }
})
