/**
 * Carousel functionality tests to improve coverage
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    mockDesktopViewport,
    mockMobileViewport,
    setupLocalStorageWithBots,
    mockBots,
} from './helpers.js'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

describe('Carousel Coverage Tests', () => {
    let chatManager

    beforeEach(() => {
        vi.clearAllMocks()
        vi.clearAllTimers()
        vi.useFakeTimers()

        // Reset modules to get fresh instance
        vi.resetModules()

        // Mock DOM elements
        document.body.innerHTML = `
            <div id="expertsContainer">
                <div id="expertsGrid"></div>
                <div id="carouselControls" style="display: none;">
                    <div id="carouselNavigation">
                        <button id="carouselPrev"></button>
                        <div id="carouselDots"></div>
                        <button id="carouselNext"></button>
                    </div>
                </div>
            </div>
            <div id="configModal" class="hidden">
                <div id="botList"></div>
            </div>
            <input id="botName" />
            <input id="botDescription" />
            <input id="botAvatar" />
            <input id="botId" />
        `

        // Mock Chatbase
        global.Chatbase = vi.fn()

        // Set mobile viewport
        mockMobileViewport()
    })

    describe('Carousel Initialization', () => {
        it('should initialize carousel with proper index', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            chatManager.bots = mockBots
            chatManager.initializeCarousel()

            expect(chatManager.currentCarouselIndex).toBe(0)
        })

        it('should setup carousel controls', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            chatManager.bots = mockBots

            const prevButton = document.getElementById('carouselPrev')
            const nextButton = document.getElementById('carouselNext')
            const addEventListenerPrev = vi.spyOn(prevButton, 'addEventListener')
            const addEventListenerNext = vi.spyOn(nextButton, 'addEventListener')

            chatManager.setupCarouselControls()

            expect(addEventListenerPrev).toHaveBeenCalledWith('click', expect.any(Function))
            expect(addEventListenerNext).toHaveBeenCalledWith('click', expect.any(Function))
        })

        it('should generate carousel dots', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            chatManager.bots = mockBots
            chatManager.generateCarouselDots()

            const dotsContainer = document.getElementById('carouselDots')
            const dots = dotsContainer.querySelectorAll('button[data-carousel-dot]')

            expect(dots.length).toBe(mockBots.length)
            expect(dots[0].getAttribute('aria-label')).toBe('Go to slide 1')
        })
    })

    describe('Carousel Navigation', () => {
        it('should navigate to next slide', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            chatManager.bots = mockBots
            chatManager.currentCarouselIndex = 0

            chatManager.navigateCarousel('next')
            expect(chatManager.currentCarouselIndex).toBe(1)
        })

        it('should navigate to previous slide', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            chatManager.bots = mockBots
            chatManager.currentCarouselIndex = 1

            chatManager.navigateCarousel('prev')
            expect(chatManager.currentCarouselIndex).toBe(0)
        })

        it('should not go beyond bounds', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            chatManager.bots = mockBots
            chatManager.currentCarouselIndex = 0

            chatManager.navigateCarousel('prev')
            expect(chatManager.currentCarouselIndex).toBe(0)

            chatManager.currentCarouselIndex = mockBots.length - 1
            chatManager.navigateCarousel('next')
            expect(chatManager.currentCarouselIndex).toBe(mockBots.length - 1)
        })
    })

    describe('Carousel Scroll Handling', () => {
        it('should setup scroll listener', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            const grid = document.getElementById('expertsGrid')
            const addEventListenerSpy = vi.spyOn(grid, 'addEventListener')

            chatManager.setupCarouselScrollListener()

            expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
            expect(chatManager.scrollListener).toBeDefined()
        })

        it('should update carousel on scroll', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            chatManager.bots = mockBots
            chatManager.currentCarouselIndex = 0

            // Create mock cards
            const grid = document.getElementById('expertsGrid')
            for (let i = 0; i < 3; i++) {
                const card = document.createElement('div')
                Object.defineProperty(card, 'offsetLeft', { value: i * 300, configurable: true })
                Object.defineProperty(card, 'offsetWidth', { value: 280, configurable: true })
                grid.appendChild(card)
            }

            Object.defineProperty(grid, 'scrollLeft', { value: 300, configurable: true })
            Object.defineProperty(grid, 'offsetWidth', { value: 300, configurable: true })
            Object.defineProperty(grid, 'offsetLeft', { value: 0, configurable: true })

            chatManager.updateCarouselOnScroll()

            expect(chatManager.currentCarouselIndex).toBe(1)
        })
    })

    describe('Carousel Indicators', () => {
        it('should update carousel indicators', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            chatManager.bots = mockBots
            chatManager.currentCarouselIndex = 1

            // Generate dots first
            chatManager.generateCarouselDots()

            const prevButton = document.getElementById('carouselPrev')
            const nextButton = document.getElementById('carouselNext')

            chatManager.updateCarouselIndicators()

            expect(prevButton.disabled).toBe(false)
            expect(nextButton.disabled).toBe(false)

            // Test at boundaries
            chatManager.currentCarouselIndex = 0
            chatManager.updateCarouselIndicators()
            expect(prevButton.disabled).toBe(true)

            chatManager.currentCarouselIndex = mockBots.length - 1
            chatManager.updateCarouselIndicators()
            expect(nextButton.disabled).toBe(true)
        })
    })

    describe('Go to Carousel Slide', () => {
        it('should go to specific slide', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            chatManager.bots = mockBots

            // Create mock cards
            const grid = document.getElementById('expertsGrid')
            const cards = []
            for (let i = 0; i < 3; i++) {
                const card = document.createElement('div')
                card.scrollIntoView = vi.fn()
                grid.appendChild(card)
                cards.push(card)
            }

            chatManager.goToCarouselSlide(2)

            expect(cards[2].scrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            })
            expect(chatManager.currentCarouselIndex).toBe(2)
        })
    })

    describe('Carousel Cleanup', () => {
        it('should cleanup carousel listeners', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            const grid = document.getElementById('expertsGrid')

            // Set up a mock scroll listener
            chatManager.scrollListener = vi.fn()
            const removeEventListenerSpy = vi.spyOn(grid, 'removeEventListener')

            chatManager.cleanupCarouselListeners()

            expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
            expect(chatManager.scrollListener).toBe(null)
        })
    })

    describe('Carousel on Resize', () => {
        it('should handle resize to mobile', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            // Start with desktop
            mockDesktopViewport()
            chatManager.bots = mockBots

            // Switch to mobile
            mockMobileViewport()

            const carouselControls = document.getElementById('carouselControls')
            chatManager.handleResize()

            // Run the timeout
            vi.runAllTimers()

            expect(carouselControls.style.display).toBe('flex')
        })

        it('should handle resize to desktop', async () => {
            const module = await import('../src/script.js')
            chatManager = module.chatManager

            // Start with mobile
            mockMobileViewport()
            chatManager.bots = mockBots

            const carouselControls = document.getElementById('carouselControls')
            carouselControls.style.display = 'flex'

            // Switch to desktop
            mockDesktopViewport()

            chatManager.handleResize()

            // Run the timeout
            vi.runAllTimers()

            expect(carouselControls.style.display).toBe('none')
        })
    })

    describe('Carousel Integration with Bot Loading', () => {
        it('should initialize carousel when loading bots on mobile', async () => {
            mockMobileViewport()
            setupLocalStorageWithBots()

            const module = await import('../src/script.js')
            chatManager = module.chatManager

            const initCarouselSpy = vi.spyOn(chatManager, 'initializeCarousel')

            chatManager.loadBots()

            // Run the timeout for carousel initialization
            vi.runAllTimers()

            expect(initCarouselSpy).toHaveBeenCalled()
        })
    })
})
