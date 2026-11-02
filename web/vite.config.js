import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // No GitHub Pages o site fica em /<nome-do-repositório>/ (definido em .env.demo).
    base: env.VITE_BASE || '/',
    plugins: [react()],
    server: {
      // Em desenvolvimento, o Vite repassa /api para o back-end (evita CORS).
      proxy: {
        '/api': env.VITE_API_URL || 'http://localhost:5196',
      },
    },
  }
})
