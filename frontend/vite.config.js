import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 后端 API 代理,开发时避免跨域
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
