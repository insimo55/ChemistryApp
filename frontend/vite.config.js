// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   // Добавляем эту секцию
//   server: {
//     // Это нужно, чтобы Vite работал внутри Docker контейнера
//     host: true, 
//     // Включаем polling для корректной работы HMR
//     watch: {
//       usePolling: true,
//     },
//   },
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      // Добавим прокси и для админки/медиа, чтобы все было доступно с одного порта
      '/admin': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://backend:8000',
        changeOrigin: true,
      }
    }
  },
})