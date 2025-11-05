import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心库单独打包
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Quill 编辑器单独打包（只在管理后台使用）
          'quill-editor': ['react-quill', 'quill'],
        }
      }
    },
    chunkSizeWarningLimit: 600, // 将警告阈值提高到 600kb
  },
})
