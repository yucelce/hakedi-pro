import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Bu satırı ekle: Dosya yollarını garantiye alır
  base: '/', 
  server: {
    host: true,
  },
  build: {
    outDir: 'dist',
  }
})