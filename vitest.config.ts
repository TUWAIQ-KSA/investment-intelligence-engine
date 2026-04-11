import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    passWithNoTests: true,
    include: ['client/src/**/*.test.ts', 'client/src/**/*.test.tsx', '**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**', 'server/**'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client/src'),
        '@shared': path.resolve(__dirname, './shared'),
        '@server': path.resolve(__dirname, './server'),
      },
    },
  },
})
