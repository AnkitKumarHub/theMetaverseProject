import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/firestore',
      'firebase/auth',
      'react-hook-form',
      'framer-motion',
      'react-quill'
    ]
  },
  resolve: {
    alias: {
      '@firebase/app': resolve(__dirname, 'node_modules/@firebase/app'),
      '@firebase/firestore': resolve(__dirname, 'node_modules/@firebase/firestore'),
      '@firebase/auth': resolve(__dirname, 'node_modules/@firebase/auth')
    }
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
}) 