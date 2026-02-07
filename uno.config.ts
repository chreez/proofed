import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({ scale: 1.2, cdn: 'https://esm.sh/' })
  ],
  theme: {
    colors: {
      stone: {
        50: 'var(--color-stone-50)', 100: 'var(--color-stone-100)', 200: 'var(--color-stone-200)',
        300: 'var(--color-stone-300)', 400: 'var(--color-stone-400)', 500: 'var(--color-stone-500)',
        600: 'var(--color-stone-600)', 700: 'var(--color-stone-700)', 800: 'var(--color-stone-800)',
        900: 'var(--color-stone-900)'
      },
      ink: 'var(--color-ink)',
      accent: { DEFAULT: 'var(--color-accent)', tint: 'var(--color-accent-tint)' },
      crust: { light: 'var(--color-crust-light)', DEFAULT: 'var(--color-crust)', dark: 'var(--color-crust-dark)' },
      cream: 'var(--color-cream)',
      surface: 'var(--color-surface)',
      success: 'var(--color-success)',
      warning: { DEFAULT: 'var(--color-warning)', tint: 'var(--color-warning-tint)' },
      danger: 'var(--color-danger)'
    },
    fontFamily: {
      mono: ['JetBrains Mono', 'monospace'],
      sans: ['Inter', 'system-ui', 'sans-serif']
    }
  },
  shortcuts: {
    'card': 'bg-surface shadow-sm p-4 border-2 border-stone-200 rounded-none',
    'card-title': 'text-lg text-heading',
    'btn': 'px-4 py-2 font-medium transition-colors cursor-pointer rounded-none appearance-none',
    'btn-primary': 'btn bg-ink text-stone-100 hover:bg-stone-800',
    'btn-secondary': 'btn bg-stone-200 text-ink hover:bg-stone-300',
    'text-heading': 'text-ink font-semibold',
    'text-body': 'text-stone-700',
    'text-muted': 'text-stone-500 text-sm',
    'checkbox-item': 'flex items-center gap-3 p-2 hover:bg-stone-50 cursor-pointer',
    'checked': 'line-through text-stone-400'
  }
})
