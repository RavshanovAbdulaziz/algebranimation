import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base: './' — sayt istalgan papkada ishlaydi (GitHub Pages: /algebranimation/).
// Marshrutlash hash orqali (#/dars/...), shuning uchun server sozlamasi kerak emas.
export default defineConfig({
  base: './',
  plugins: [react()],
})
