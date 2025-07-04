import {
    defineConfig,
    presetWebFonts,
    presetIcons,
    presetTypography,
    transformerVariantGroup,
    transformerDirectives,
} from 'unocss'
import presetWind4 from '@unocss/preset-wind4'

export default defineConfig({
    // Static extraction with @unocss-include comments
    // All CSS classes are now detected from source files
    safelist: [],
    presets: [
        presetWind4({
            preflights: {
                reset: true,
                theme: 'on-demand',
            },
        }),
        presetIcons({
            scale: 1.2,
            cdn: 'https://esm.sh/',
        }),
        presetTypography(),
        presetWebFonts({
            provider: 'google',
            fonts: {
                sans: 'Inter:400,500,600,700',
                mono: 'Fira Code',
            },
            inlineImports: false,
            timeout: 5000,
        }),
    ],
    transformers: [transformerVariantGroup(), transformerDirectives()],
    theme: {
        colors: {
            primary: {
                DEFAULT: '#3b82f6',
                50: '#eff6ff',
                100: '#dbeafe',
                200: '#bfdbfe',
                300: '#93c5fd',
                400: '#60a5fa',
                500: '#3b82f6',
                600: '#2563eb',
                700: '#1d4ed8',
                800: '#1e40af',
                900: '#1e3a8a',
                950: '#172554',
            },
            'brand-blue': '#2563eb',
            'brand-blue-dark': '#1d4ed8',
            'brand-green': '#059669',
            'brand-orange': '#f59e0b',
            'brand-orange-dark': '#d97706',
            'github-dark': '#24292e',
            'github-darker': '#1b1f23',
            'gray-light': '#f5f5f5',
        },
    },
    shortcuts: {
        btn: 'px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-600 transition-colors duration-200',
        'btn-outline':
            'px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200',
        card: 'p-6 rounded-xl bg-white shadow-lg',
        input: 'px-4 py-2 rounded-lg border border-gray-300 focus:border-primary focus:outline-none transition-colors',
    },
    rules: [
        [
            'custom-scrollbar',
            {
                'scrollbar-width': 'thin',
                'scrollbar-color': '#cbd5e1 #f1f5f9',
            },
        ],
    ],
})
