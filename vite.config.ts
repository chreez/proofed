import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

function devFavicon(): Plugin {
  return {
    name: 'dev-favicon',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (ctx.server) {
          return html.replace('/favicon.svg', '/favicon-dev.svg')
        }
        return html
      }
    }
  }
}

export default defineConfig({
  plugins: [vue(), UnoCSS(), devFavicon()],
  resolve: {
    alias: { '@': '/src' }
  }
})
