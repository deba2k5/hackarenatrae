import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'webview' ? './' : '/',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: true,
  },
  build: mode === 'webview'
    ? {
        outDir: path.resolve(__dirname, '../extension/media/webview'),
        emptyOutDir: true,
      }
    : undefined,
}))
