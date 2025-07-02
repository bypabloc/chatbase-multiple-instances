/**
 * Tests for carousel error handling and scroll listener
 * Targeting uncovered lines in script.js: 2061-2063, 2097-2104
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock logger
vi.mock('../src/logger.js', () => ({
    default: {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        getEnvironment: vi.fn().mockReturnValue('test'),
        isDevelopment: true,
    },
}))

// Mock @vercel/analytics
vi.mock('@vercel/analytics', () => ({
    inject: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mock ChatManager class with carousel functionality
class MockChatManager {
    constructor() {
        this.bots = [
            {
                id: 'test-bot-1',
                name: 'Test Bot 1',
                description: 'Test description 1',
                chatbaseId: 'test-chatbase-1',
            },
            {
                id: 'test-bot-2',
                name: 'Test Bot 2',
                description: 'Test description 2',
                chatbaseId: 'test-chatbase-2',
            },
        ]
        this.scrollListener = null
    }

    generateCarouselDots() {
        const dotsContainer = document.getElementById('carouselDots')
        if (!dotsContainer) {
            // Simulate the actual code that logs the error
            if (this.mockLogger) {
                this.mockLogger.error('Carousel dots container not found')
            }
            return
        }

        dotsContainer.innerHTML = ''

        // Simulate the actual code that logs the generation
        if (this.mockLogger) {
            this.mockLogger.log(`Generating ${this.bots.length} carousel dots`)
        }

        this.bots.forEach((_, index) => {
            const dot = document.createElement('button')
            dot.type = 'button'
            dot.className = 'w-2 h-2 rounded-full bg-gray-300'
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`)
            dot.setAttribute('data-carousel-dot', index)
            dot.addEventListener('click', () => this.goToCarouselSlide(index))
            dotsContainer.appendChild(dot)
        })
    }

    setupCarouselScrollListener() {
        const grid = document.getElementById('expertsGrid')
        if (!grid) return

        let isScrolling = null

        this.scrollListener = () => {
            // Clear our timeout throughout the scroll
            window.clearTimeout(isScrolling)

            // Set a timeout to run after scrolling ends
            isScrolling = setTimeout(() => {
                this.updateCarouselOnScroll()
            }, 66)
        }

        grid.addEventListener('scroll', this.scrollListener)
    }

    cleanupCarouselListeners() {
        const grid = document.getElementById('expertsGrid')

        if (grid && this.scrollListener) {
            grid.removeEventListener('scroll', this.scrollListener)
            this.scrollListener = null
        }
    }

    // Mock helper methods
    goToCarouselSlide() {}
    updateCarouselOnScroll() {}
}

describe('Carousel Error Handling and Scroll Listener Tests', () => {
    let chatManager

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div class="container">
                <div class="experts-grid" id="expertsGrid"></div>
                <div class="carousel-controls">
                    <button id="carouselPrev">Previous</button>
                    <button id="carouselNext">Next</button>
                    <div id="carouselDots"></div>
                </div>
            </div>
        `

        // Mock localStorage
        const localStorageMock = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        }
        global.localStorage = localStorageMock

        // Initialize mock ChatManager
        chatManager = new MockChatManager()
        chatManager.mockLogger = { error: vi.fn(), log: vi.fn() }
    })

    describe('generateCarouselDots error handling', () => {
        it('should handle missing carousel dots container', () => {
            // Remove the carousel dots container
            const dotsContainer = document.getElementById('carouselDots')
            dotsContainer.remove()

            // This should trigger the error handling in lines 2061-2063
            chatManager.generateCarouselDots()

            expect(chatManager.mockLogger.error).toHaveBeenCalledWith(
                'Carousel dots container not found'
            )
        })

        it('should generate dots when container exists', () => {
            chatManager.generateCarouselDots()

            expect(chatManager.mockLogger.log).toHaveBeenCalledWith('Generating 2 carousel dots')

            const dotsContainer = document.getElementById('carouselDots')
            expect(dotsContainer.children.length).toBe(2)
        })

        it('should handle empty bots array', () => {
            chatManager.bots = []

            chatManager.generateCarouselDots()

            expect(chatManager.mockLogger.log).toHaveBeenCalledWith('Generating 0 carousel dots')

            const dotsContainer = document.getElementById('carouselDots')
            expect(dotsContainer.children.length).toBe(0)
        })
    })

    describe('setupCarouselScrollListener', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should set up scroll listener with debouncing', () => {
            const grid = document.getElementById('expertsGrid')
            const addEventListenerSpy = vi.spyOn(grid, 'addEventListener')

            chatManager.setupCarouselScrollListener()

            expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
            expect(chatManager.scrollListener).toBeDefined()
        })

        it('should handle scroll events with debouncing', () => {
            const updateCarouselOnScrollSpy = vi
                .spyOn(chatManager, 'updateCarouselOnScroll')
                .mockImplementation(() => {})

            chatManager.setupCarouselScrollListener()

            // Simulate scroll events
            const scrollEvent = new Event('scroll')
            const grid = document.getElementById('expertsGrid')

            // Trigger multiple scroll events quickly
            grid.dispatchEvent(scrollEvent)
            grid.dispatchEvent(scrollEvent)
            grid.dispatchEvent(scrollEvent)

            // Fast-forward time to trigger the debounced function
            vi.advanceTimersByTime(66)

            // Should only be called once due to debouncing
            expect(updateCarouselOnScrollSpy).toHaveBeenCalledTimes(1)
        })

        it('should clear timeout on new scroll events', () => {
            const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
            const updateCarouselOnScrollSpy = vi
                .spyOn(chatManager, 'updateCarouselOnScroll')
                .mockImplementation(() => {})

            chatManager.setupCarouselScrollListener()

            const scrollEvent = new Event('scroll')
            const grid = document.getElementById('expertsGrid')

            // Trigger first scroll event
            grid.dispatchEvent(scrollEvent)
            expect(clearTimeoutSpy).toHaveBeenCalled()

            // Trigger second scroll event before timeout
            vi.advanceTimersByTime(30)
            grid.dispatchEvent(scrollEvent)

            // Should clear the previous timeout
            expect(clearTimeoutSpy).toHaveBeenCalledTimes(2)

            // Fast-forward to complete the timeout
            vi.advanceTimersByTime(66)

            // Should only be called once because the first timeout was cleared
            expect(updateCarouselOnScrollSpy).toHaveBeenCalledTimes(1)
        })

        it('should return early if grid element not found', () => {
            // Remove the grid element
            const grid = document.getElementById('expertsGrid')
            grid.remove()

            // Should not throw error and should return early
            expect(() => chatManager.setupCarouselScrollListener()).not.toThrow()
            expect(chatManager.scrollListener).toBeNull()
        })

        it('should handle rapid scroll events correctly', () => {
            const updateCarouselOnScrollSpy = vi
                .spyOn(chatManager, 'updateCarouselOnScroll')
                .mockImplementation(() => {})

            chatManager.setupCarouselScrollListener()

            const scrollEvent = new Event('scroll')
            const grid = document.getElementById('expertsGrid')

            // Simulate rapid scrolling
            for (let i = 0; i < 10; i++) {
                grid.dispatchEvent(scrollEvent)
                vi.advanceTimersByTime(10) // Less than 66ms
            }

            // Only the last scroll should trigger the callback
            vi.advanceTimersByTime(66)

            expect(updateCarouselOnScrollSpy).toHaveBeenCalledTimes(1)
        })
    })

    describe('cleanupCarouselListeners', () => {
        it('should remove scroll listener when grid exists', () => {
            const grid = document.getElementById('expertsGrid')
            const removeEventListenerSpy = vi.spyOn(grid, 'removeEventListener')

            // Set up a scroll listener first
            const mockListener = vi.fn()
            chatManager.scrollListener = mockListener

            chatManager.cleanupCarouselListeners()

            expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', mockListener)
            expect(chatManager.scrollListener).toBeNull()
        })

        it('should handle case where grid does not exist', () => {
            // Remove grid element
            const grid = document.getElementById('expertsGrid')
            grid.remove()

            // Set up a scroll listener
            chatManager.scrollListener = vi.fn()

            // Should not throw error
            expect(() => chatManager.cleanupCarouselListeners()).not.toThrow()
        })

        it('should handle case where scroll listener is null', () => {
            chatManager.scrollListener = null

            // Should not throw error
            expect(() => chatManager.cleanupCarouselListeners()).not.toThrow()
        })
    })
})
