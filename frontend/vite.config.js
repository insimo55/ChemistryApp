import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Добавляем эту секцию
  server: {
    // Это нужно, чтобы Vite работал внутри Docker контейнера
    host: true, 
    // Включаем polling для корректной работы HMR
    watch: {
      usePolling: true,
    },
  },
})