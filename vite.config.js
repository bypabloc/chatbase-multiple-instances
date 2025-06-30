import { defineConfig, loadEnv } from 'vite'
import UnoCSS from 'unocss/vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Helper function to process HTML files
function processHtmlFile(item, basePath, inputConfig) {
    const relativePath = basePath ? `${basePath}/${item}` : item
    const name = item.replace('.html', '')
    const entryName = basePath ? `${basePath.replace('/', '_')}_${name}` : name

    inputConfig[entryName] = resolve(__dirname, 'src', relativePath)
}

// Helper function to check if directory should be scanned
function shouldScanDirectory(item) {
    return item !== 'node_modules' && !item.startsWith('.')
}

// Function to scan src directory for HTML files and generate input config
function generateInputConfig() {
    const srcDir = resolve(__dirname, 'src')
    const inputConfig = {}

    function scanSrcDirectory(dirPath, basePath = '') {
        const items = readdirSync(dirPath)

        for (const item of items) {
            const fullPath = join(dirPath, item)
            const stat = statSync(fullPath)

            if (stat.isFile() && item.endsWith('.html')) {
                processHtmlFile(item, basePath, inputConfig)
            } else if (stat.isDirectory() && shouldScanDirectory(item)) {
                const subPath = basePath ? `${basePath}/${item}` : item
                scanSrcDirectory(fullPath, subPath)
            }
        }
    }

    scanSrcDirectory(srcDir)
    return inputConfig
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const inputConfig = generateInputConfig()

    return {
        // Define environment variables for client
        define: {
            'import.meta.env.VITE_ENV': JSON.stringify(env.ENV || mode),
        },

        // Plugins
        plugins: [
            UnoCSS(),
            {
                name: 'auto-pages-plugin',
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

                    // Generate routes for all pages dynamically
                    function generatePageRoutes() {
                        const routes = new Map()

                        Object.entries(inputConfig).forEach(([_entryName, fullPath]) => {
                            const relativePath = fullPath.replace(resolve(__dirname, 'src'), '')

                            if (relativePath.includes('/pages/')) {
                                // Extract page name from pages directory
                                const pageName = relativePath
                                    .replace('/pages/', '')
                                    .replace('.html', '')
                                routes.set(`/${pageName}`, `/pages/${pageName}.html`)
                            }
                        })

                        return routes
                    }

                    const pageRoutes = generatePageRoutes()

                    server.middlewares.use((req, res, next) => {
                        // Handle automatic page routes
                        const url = req.url?.split('?')[0] // Remove query params
                        if (pageRoutes.has(url) || pageRoutes.has(`${url}/`)) {
                            const route = pageRoutes.get(url) || pageRoutes.get(`${url}/`)
                            req.url = route
                        }
                        // Handle API endpoint for files
                        else if (req.url === '/api/files') {
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
                input: inputConfig,
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
