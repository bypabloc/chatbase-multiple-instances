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
        lines: 50,
        functions: 30,
        branches: 80,
        statements: 50
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