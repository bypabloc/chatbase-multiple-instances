import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.*',
        'dist/',
        'coverage/'
      ],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 87,
        functions: 74,
        branches: 88,
        statements: 87
      }
    },
    include: ['test/**/*.test.js'],
    exclude: ['node_modules/', 'dist/']
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
})