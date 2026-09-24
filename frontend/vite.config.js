import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Mirrors the Vercel rewrite in vercel.json: with VITE_API_URL empty, the app
// calls /api/* on its own origin and this forwards it to the local gateway.
const apiProxy = {
  "/api": {
    target: process.env.API_PROXY_TARGET || "http://localhost:8000",
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
  build: {
    // don't ship source to production
    sourcemap: false,
  },
})
