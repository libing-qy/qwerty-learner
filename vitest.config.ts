import react from '@vitejs/plugin-react'
import { webcrypto } from 'node:crypto'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
  })
}

export default defineConfig({
  plugins: [react()],
  define: {
    REACT_APP_DEPLOY_ENV: JSON.stringify('test'),
    LATEST_COMMIT_HASH: JSON.stringify('test'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
