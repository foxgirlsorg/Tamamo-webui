import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The admin API runs as a separate Tamamo process; during development the
// Vite server forwards /api and /assets to it.
const apiTarget = 'http://localhost:8081'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Keep the browser's Host header: the API refuses requests whose Origin
    // doesn't match it (CSRF protection), just like behind nginx.
    proxy: Object.fromEntries(
      ['/api', '/assets'].map((p) => [
        p,
        {
          target: apiTarget,
          configure: (proxy) => {
            proxy.on('proxyReq', (req, incoming) => {
              if (incoming.headers.host) req.setHeader('host', incoming.headers.host)
            })
          },
        },
      ]),
    ),
  },
})
