import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const serverDir = fileURLToPath(new URL('../server', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, serverDir, '')
  const apiPort = process.env.PORT || env.PORT || '3001'
  const showDemo = (process.env.SEED_DEMO ?? env.SEED_DEMO) === 'true'
  const demoEmail = process.env.DEMO_EMAIL ?? env.DEMO_EMAIL ?? ''
  const demoPassword = process.env.DEMO_PASSWORD ?? env.DEMO_PASSWORD ?? ''

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Bonnote',
          short_name: 'Bonnote',
          description: '一张可以随身带着的纸。',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#efe7da',
          theme_color: '#efe7da',
          lang: 'zh-CN',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2}'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    define: {
      'import.meta.env.VITE_DEMO_EMAIL': JSON.stringify(showDemo ? demoEmail : ''),
      'import.meta.env.VITE_DEMO_PASSWORD': JSON.stringify(showDemo ? demoPassword : ''),
    },
    server: {
      host: env.WEB_HOST || '127.0.0.1',
      port: Number(env.WEB_PORT || 5173),
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})
