import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@react-buoy/core': path.resolve(__dirname, '../packages/devtools-floating-menu/src'),
      '@react-buoy/env': path.resolve(__dirname, '../packages/env-tools/src'),
      '@react-buoy/network': path.resolve(__dirname, '../packages/network/src'),
      '@react-buoy/react-query': path.resolve(__dirname, '../packages/react-query/src'),
      '@react-buoy/shared-ui': path.resolve(__dirname, '../packages/shared/src'),
      '@react-buoy/storage': path.resolve(__dirname, '../packages/storage/src'),
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
