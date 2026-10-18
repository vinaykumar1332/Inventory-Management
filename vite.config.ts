import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'
import appConfig from './src/config/app.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    // Static hosts without SPA rewrites (e.g. GitHub Pages) serve 404.html for deep links like /dashboard
    {
      name: 'spa-404-fallback',
      closeBundle() {
        const dist = path.resolve(import.meta.dirname, 'dist')
        if (fs.existsSync(path.join(dist, 'index.html'))) fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'))
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: appConfig.app.name,
        short_name: appConfig.app.shortName,
        description: appConfig.app.description,
        theme_color: appConfig.app.themeColor,
        background_color: appConfig.app.backgroundColor,
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        lang: appConfig.locale.defaultLanguage,
        categories: ['business', 'productivity'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Upload bill', url: '/upload', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Inventory', url: '/inventory', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Alerts', url: '/alerts', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // Precache the whole app shell (incl. lazy routes) so the demo works offline
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('xlsx')) return 'xlsx'
          if (id.includes('@radix-ui')) return 'radix'
          if (id.includes('i18next')) return 'i18n'
          return undefined
        },
      },
    },
  },
})
