import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 将 /api 路径的请求代理到后端服务
      '/api': {
        target: 'http://localhost:3001', // 后端服务地址
        changeOrigin: true, // 改变源，解决跨域问题
        secure: false, // 支持 http
      }
    }
  }
})