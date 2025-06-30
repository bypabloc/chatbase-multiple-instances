import { defineConfig, loadEnv } from 'vite'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        // Define environment variables for client
        define: {
            'import.meta.env.VITE_ENV': JSON.stringify(env.ENV || mode),
        },

        // Plugins
        plugins: [
            UnoCSS(),
            {
                name: 'custom-routes',
                configureServer(server) {
                    // Function to scan public directory recursively
                    function scanDirectory(dirPath, basePath = '') {
                        const files = []
                        const items = readdirSync(dirPath)

                        for (const item of items) {
                            const fullPath = join(dirPath, item)
                            const stat = statSync(fullPath)
                            const relativePath = basePath ? `${basePath}/${item}` : item

                            if (stat.isFile()) {
                                files.push({
                                    name: item,
                                    url: `/public/${relativePath}`,
                                    size: stat.size,
                                    modified: stat.mtime,
                                    extension: extname(item).toLowerCase().slice(1),
                                    path: relativePath,
                                })
                            } else if (stat.isDirectory()) {
                                const subFiles = scanDirectory(fullPath, relativePath)
                                files.push(...subFiles)
                            }
                        }

                        return files
                    }

                    server.middlewares.use((req, res, next) => {
                        if (req.url === '/files' || req.url === '/files/') {
                            req.url = '/pages/files.html'
                        } else if (req.url === '/api/files') {
                            res.setHeader('Content-Type', 'application/json')
                            res.setHeader('Access-Control-Allow-Origin', '*')

                            try {
                                const publicDir = resolve(__dirname, 'public')
                                const files = scanDirectory(publicDir)
                                res.end(JSON.stringify({ files, success: true }))
                            } catch (error) {
                                res.statusCode = 500
                                res.end(
                                    JSON.stringify({
                                        error: error.message,
                                        success: false,
                                    })
                                )
                            }
                            return
                        }
                        next()
                    })
                },
            },
        ],

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
                input: {
                    main: resolve(__dirname, 'src/index.html'),
                    files: resolve(__dirname, 'src/pages/files.html'),
                },
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
    }
})
