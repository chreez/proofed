import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        global: {
          statements: 70,
          branches: 55,
          functions: 75,
          lines: 70,
        },
      },
    },
    globals: true
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  }
})
