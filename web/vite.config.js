import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Em desenvolvimento, o Vite repassa /api para o back-end (evita CORS).
    proxy: {
      '/api': process.env.VITE_API_URL ?? 'http://localhost:5196',
    },
  },
})
