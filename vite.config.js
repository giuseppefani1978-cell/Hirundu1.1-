import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Hirundu1.1-/', // <-- mets EXACTEMENT le nom du repo
})
