import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'

export default defineConfig({
    // Plugins
    plugins: [UnoCSS()],

    // Configuración del servidor de desarrollo
    server: {
        port: 3000,
        open: true,
        host: true,
    },

    // Configuración de la estructura del proyecto
    root: 'src',

    // Configuración del build
    build: {
        outDir: '../dist',
        assetsDir: 'assets',
        minify: 'terser',
        sourcemap: false,

        // Optimizaciones avanzadas
        rollupOptions: {
            output: {
                // Nombres de archivos optimizados
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash].[ext]',

                // Manualmente especificar chunks para mejor control
                manualChunks: undefined,
            },
        },

        // Configuraciones de terser para minificación más agresiva
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
                passes: 2,
            },
            mangle: {
                toplevel: true,
                safari10: true,
            },
            format: {
                comments: false,
            },
        },

        // Configuración de CSS
        cssMinify: true,

        // Configuración de assets
        assetsInlineLimit: 4096, // 4kb

        // Configuración de chunks
        chunkSizeWarningLimit: 500,
    },

    // Configuración de CSS
    css: {
        devSourcemap: true,
    },

    // Configuración de assets
    publicDir: '../public',

    // Configuración base para deployment
    base: './',

    // Configuración de preview
    preview: {
        port: 3000,
        host: true,
        open: true,
    },
})
