import react from '@vitejs/plugin-react'
import { promises as fs } from 'fs'
import { webcrypto } from 'node:crypto'
import path from 'node:path'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vitest/config'

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
  })
}

export default defineConfig({
  plugins: [
    react(),
    Icons({
      compiler: 'jsx',
      jsx: 'react',
      customCollections: {
        'my-icons': {
          xiaohongshu: () => fs.readFile('./src/assets/xiaohongshu.svg', 'utf-8'),
        },
      },
    }),
  ],
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
