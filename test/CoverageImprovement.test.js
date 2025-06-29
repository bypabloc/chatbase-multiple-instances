import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock @vercel/analytics before importing script.js
vi.mock('@vercel/analytics', () => ({
    inject: vi.fn(),
}))

// Mock window.matchMedia for theme system
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

describe('Coverage Improvement Tests', () => {
    let chatManager

    beforeEach(async () => {
        // Clear DOM and reset
        document.body.innerHTML = `
            <div class="container">
                <div class="experts-grid" id="expertsGrid"></div>
            </div>
            <div class="modal" id="configModal">
                <div class="modal-content">
                    <div class="bot-list" id="botList"></div>
                </div>
            </div>
        `

        localStorage.clear()
        vi.clearAllMocks()

        // Mock window.Chatbase
        window.Chatbase = vi.fn()

        // Import real script
        await import('../src/script.js')
        chatManager = window.chatManager
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('updateButtonStates coverage', () => {
        it('should disable import button when no file is selected', () => {
            // chatManager is already initialized globally

            // Setup DOM elements
            const importFile = document.createElement('input')
            importFile.type = 'file'
            importFile.id = 'importFile'
            // Mock empty FileList
            Object.defineProperty(importFile, 'files', {
                value: [],
                writable: false,
            })
            document.body.appendChild(importFile)

            const importButton = document.createElement('button')
            importButton.id = 'importButton'
            document.body.appendChild(importButton)

            chatManager.updateButtonStates()

            expect(importButton.disabled).toBe(true)
            expect(importButton.className).toContain('bg-gray-400')
            expect(importButton.className).toContain('cursor-not-allowed')
        })

        it('should enable import button when file is selected', () => {
            // chatManager is already initialized globally

            // Setup DOM elements
            const importFile = document.createElement('input')
            importFile.type = 'file'
            importFile.id = 'importFile'
            // Mock files property
            Object.defineProperty(importFile, 'files', {
                value: [{ name: 'test.json' }],
                writable: false,
            })
            document.body.appendChild(importFile)

            const importButton = document.createElement('button')
            importButton.id = 'importButton'
            document.body.appendChild(importButton)

            chatManager.updateButtonStates()

            expect(importButton.disabled).toBe(false)
            expect(importButton.className).toContain('bg-brand-green')
            expect(importButton.className).toContain('cursor-pointer')
        })

        it('should disable clear all button when no bots exist', () => {
            // chatManager is already initialized globally
            chatManager.bots = [] // No bots

            const clearAllButton = document.createElement('button')
            clearAllButton.id = 'clearAllButton'
            document.body.appendChild(clearAllButton)

            chatManager.updateButtonStates()

            expect(clearAllButton.disabled).toBe(true)
            expect(clearAllButton.className).toContain('bg-gray-400')
            expect(clearAllButton.className).toContain('cursor-not-allowed')
        })

        it('should enable clear all button when bots exist', () => {
            // chatManager is already initialized globally
            chatManager.bots = [{ id: '1', name: 'Test Bot' }] // Has bots

            const clearAllButton = document.createElement('button')
            clearAllButton.id = 'clearAllButton'
            document.body.appendChild(clearAllButton)

            chatManager.updateButtonStates()

            expect(clearAllButton.disabled).toBe(false)
            expect(clearAllButton.className).toContain('bg-red-600')
            expect(clearAllButton.className).toContain('cursor-pointer')
        })

        it('should handle missing DOM elements gracefully', () => {
            // chatManager is already initialized globally

            // No elements in DOM
            expect(() => chatManager.updateButtonStates()).not.toThrow()
        })

        it('should handle null files property', () => {
            // chatManager is already initialized globally

            const importFile = document.createElement('input')
            importFile.type = 'file'
            importFile.id = 'importFile'
            importFile.files = null
            document.body.appendChild(importFile)

            const importButton = document.createElement('button')
            importButton.id = 'importButton'
            document.body.appendChild(importButton)

            chatManager.updateButtonStates()

            expect(importButton.disabled).toBe(true)
        })
    })

    describe('Storage edge cases', () => {
        it('should handle corrupt localStorage data', () => {
            localStorage.getItem.mockReturnValue('invalid json {')

            // chatManager is already initialized globally
            chatManager.loadBots()

            expect(chatManager.bots).toEqual([])
            expect(console.error).toHaveBeenCalled()
        })

        it('should handle localStorage exceptions', () => {
            localStorage.getItem.mockImplementation(() => {
                throw new Error('Storage error')
            })

            // chatManager is already initialized globally
            expect(() => chatManager.loadBots()).not.toThrow()
            expect(chatManager.bots).toEqual([])
        })
    })
})
