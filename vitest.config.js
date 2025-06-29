import { defineConfig } from 'vitest/config'
import UnoCSS from 'unocss/vite'

export default defineConfig({
    plugins: [UnoCSS()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./test/setup.js'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.js'],
            exclude: ['node_modules/', 'test/', '**/*.config.*', 'dist/', 'coverage/'],
            reportsDirectory: './coverage',
            thresholds: {
                lines: 90,
                functions: 75,
                branches: 86,
                statements: 90,
            },
        },
        include: ['test/**/*.test.js'],
        exclude: ['node_modules/', 'dist/'],
    },
    resolve: {
        alias: {
            '@': new URL('./src', import.meta.url).pathname,
            'uno.css': 'unocss',
        },
    },
})
