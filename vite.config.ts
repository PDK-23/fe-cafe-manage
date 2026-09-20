import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
const apiPort = Number(process.env.CAFE_API_BASE_PORT || 8080)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/auth': `http://127.0.0.1:${apiPort}`,
      '/api/catalog': `http://127.0.0.1:${apiPort + 1}`,
      '/api/pos': `http://127.0.0.1:${apiPort + 2}`,
      '/api/permissions': `http://127.0.0.1:${apiPort + 3}`,
    },
    open: !process.env.CAFE_TEST_BASE_URL,
  },
})
