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
        50: '#faf9f7', 100: '#f5f3ef', 200: '#e8e4dc',
        300: '#d4cdc1', 400: '#b8ad9c', 500: '#9c8e78',
        600: '#7d6e58', 700: '#5f5243', 800: '#433a2f', 900: '#2a241e'
      },
      ink: '#1a1816',
      accent: '#a65d45',
      crust: { light: '#c9a66b', DEFAULT: '#a67c52', dark: '#6b4423' },
      cream: '#fff8e7',
      success: '#6b8e4e',
      warning: '#c9a66b',
      danger: '#a65252'
    },
    fontFamily: {
      mono: ['JetBrains Mono', 'monospace'],
      sans: ['Inter', 'system-ui', 'sans-serif']
    }
  },
  shortcuts: {
    'card': 'bg-white shadow-sm p-4 border-2 border-stone-200',
    'btn': 'px-4 py-2 font-medium transition-colors cursor-pointer',
    'btn-primary': 'btn bg-ink text-stone-100 hover:bg-stone-800',
    'btn-secondary': 'btn bg-stone-200 text-ink hover:bg-stone-300',
    'text-heading': 'text-ink font-semibold',
    'text-body': 'text-stone-700',
    'text-muted': 'text-stone-500 text-sm',
    'checkbox-item': 'flex items-center gap-3 p-2 hover:bg-stone-50 cursor-pointer',
    'checked': 'line-through text-stone-400'
  }
})
