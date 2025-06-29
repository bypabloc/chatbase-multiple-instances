/**
 * Test helpers and mock data for Chatbase Manager tests
 */

/**
 * Sample bot data for testing
 */
export const mockBots = [
    {
        id: 'maria-financiera',
        name: 'María Financiera',
        description: 'Experta en finanzas personales',
        chatbaseId: 'ABC123',
        avatar: 'https://example.com/maria.jpg',
        isDefault: true,
    },
    {
        id: 'juan-inversion',
        name: 'Juan Inversión',
        description: 'Especialista en inversiones',
        chatbaseId: 'DEF456',
        avatar: null,
        isDefault: false,
    },
    {
        id: 'ana-deudas',
        name: 'Ana Deudas',
        description: 'Te ayuda a salir de deudas',
        chatbaseId: 'GHI789',
        avatar: 'https://example.com/ana.jpg',
        isDefault: false,
    },
]

/**
 * Invalid bot data for testing validation
 */
export const invalidBots = [
    {
        // Missing required fields
        id: 'invalid-bot',
    },
    {
        // Wrong data types
        id: 123,
        name: true,
        description: [],
        chatbaseId: {},
        avatar: 456,
        isDefault: 'yes',
    },
]

/**
 * Create a mock ChatbaseManager instance with test data
 */
export function createMockChatbaseManager(ChatbaseManager) {
    // Create instance but don't initialize to avoid DOM setup
    const manager = Object.create(ChatbaseManager.prototype)
    manager.bots = [...mockBots]
    manager.chatInstances = {}
    manager.currentBotId = null
    manager.lastMinimizedBotId = null
    manager.isTransitioning = false

    // Mock the methods that interact with DOM
    manager.renderExperts = vi.fn()
    manager.updateFloatingChatButton = vi.fn()
    manager.setupEventListeners = vi.fn()

    return manager
}

/**
 * Create a mock File object for testing file imports
 */
export function createMockFile(content, filename = 'test.json', type = 'application/json') {
    const blob = new Blob([content], { type })
    blob.name = filename
    return blob
}

/**
 * Create a mock FileReader for testing file reading
 */
export function createMockFileReader(result) {
    return {
        readAsText: vi.fn(function () {
            setTimeout(() => {
                this.result = result
                this.onload?.({ target: { result } })
            }, 0)
        }),
        result: null,
        onload: null,
        onerror: null,
    }
}

/**
 * Wait for DOM updates and event loop
 */
export function waitForDOM() {
    return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Create a mock iframe element
 */
export function createMockIframe() {
    const iframe = document.createElement('iframe')
    iframe.onload = null
    iframe.onerror = null

    // Mock the load event
    setTimeout(() => {
        iframe.onload?.()
    }, 0)

    return iframe
}

/**
 * Mock window.innerWidth for mobile testing
 */
export function mockMobileViewport() {
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
    })
}

/**
 * Mock window.innerWidth for desktop testing
 */
export function mockDesktopViewport() {
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
    })
}

/**
 * Create a mock click event
 */
export function createMockClickEvent(target = document.body) {
    return new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        target,
    })
}

/**
 * Assert that an element has the correct CSS styles
 */
export function assertElementStyles(element, expectedStyles) {
    const styles = element.style.cssText || element.getAttribute('style') || ''

    Object.entries(expectedStyles).forEach(([property, value]) => {
        expect(styles).toContain(`${property}: ${value}`)
    })
}

/**
 * Create a spy on console methods
 */
export function createConsoleSpy() {
    return {
        log: vi.spyOn(console, 'log'),
        error: vi.spyOn(console, 'error'),
        warn: vi.spyOn(console, 'warn'),
    }
}

/**
 * Simulate localStorage with data
 */
export function setupLocalStorageWithBots(bots = mockBots) {
    localStorage.getItem.mockImplementation(key => {
        if (key === 'chatbaseBots') {
            return JSON.stringify(bots)
        }
        return null
    })
}
