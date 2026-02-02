import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite acceso desde red local para testing en móvil
    proxy: {
      '/api': {
        target: 'https://io.twittetec.com',
        changeOrigin: true,
        secure: true,
      },
      '/hubs': {
        target: 'https://io.twittetec.com',
        changeOrigin: true,
        secure: true,
        ws: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          signalr: ['@microsoft/signalr']
        }
      }
    },
    // Optimizaciones para PWA
    manifest: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
      }
    }
  }
})
