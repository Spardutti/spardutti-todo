import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',  // Browser environment for KeyboardEvent and DOM APIs
    include: [
      'src/**/*.test.ts',      // Renderer process tests
      'electron/**/*.test.ts'  // Main process tests
    ],
    globals: true,  // Enable global test APIs (describe, it, expect)
    passWithNoTests: true,  // Exit with code 0 when no tests found
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@electron': path.resolve(__dirname, 'electron'),
    },
  },
})
