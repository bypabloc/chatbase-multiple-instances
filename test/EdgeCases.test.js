/**
 * Tests for edge cases, error handling, and boundary conditions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockClickEvent, mockBots } from './helpers.js'

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

// Comprehensive ChatbaseManager for edge case testing
const mockChatbaseManagerClass = class ChatbaseManager {
    constructor() {
        this.bots = []
        this.chatInstances = {}
        this.currentBotId = null
        this.lastMinimizedBotId = null
        this.isTransitioning = false
    }

    loadBots() {
        try {
            const savedBots = localStorage.getItem('chatbaseBots')
            this.bots = savedBots ? JSON.parse(savedBots) : []
            this.renderExperts()
            this.updateFloatingChatButton()
        } catch (error) {
            console.error('Error loading bots:', error)
            this.bots = []
            this.renderExperts()
            this.updateFloatingChatButton()
        }
    }

    saveBots() {
        try {
            localStorage.setItem('chatbaseBots', JSON.stringify(this.bots))
        } catch (error) {
            console.error('Error saving bots:', error)
        }
    }

    getDefaultBot() {
        if (!this.bots || this.bots.length === 0) return null
        return this.bots.find(bot => bot.isDefault) || this.bots[0]
    }

    renderExperts() {
        const grid = document.getElementById('expertsGrid')
        if (!grid) {
            console.warn('expertsGrid element not found')
            return
        }

        try {
            grid.innerHTML = ''
            this.bots.forEach(bot => {
                const card = this.createExpertCard(bot)
                grid.appendChild(card)
            })
        } catch (error) {
            console.error('Error rendering experts:', error)
        }
    }

    createExpertCard(bot) {
        if (!bot || typeof bot !== 'object') {
            throw new Error('Invalid bot data provided to createExpertCard')
        }

        const card = document.createElement('div')
        card.className = 'expert-card'
        card.setAttribute('data-testid', `expert-card-${bot.id}`)

        // Sanitize bot data to prevent XSS
        const safeName = this.sanitizeHTML(bot.name || 'Unknown')
        const safeDescription = this.sanitizeHTML(bot.description || 'No description')
        const safeId = this.sanitizeHTML(bot.id || 'unknown')

        card.innerHTML = `
      <div class="avatar-container">
        <div id="avatar-${safeId}" class="avatar-fallback">${this.getInitials(safeName)}</div>
      </div>
      <h3 class="expert-name">${safeName}</h3>
      <p class="expert-description">${safeDescription}</p>
      <button 
        class="talk-button" 
        id="btn-${safeId}" 
        data-testid="talk-button-${safeId}"
      >
        HABLAR CON ${safeName.toUpperCase()}
      </button>
    `

        return card
    }

    sanitizeHTML(str) {
        const div = document.createElement('div')
        div.textContent = str
        return div.innerHTML
    }

    getInitials(name) {
        if (!name || typeof name !== 'string') return '?'

        try {
            return name
                .split(' ')
                .map(word => word.trim())
                .filter(word => word.length > 0)
                .map(word => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
        } catch (error) {
            console.error('Error generating initials:', error)
            return '?'
        }
    }

    updateFloatingChatButton() {
        try {
            this.removeFloatingButton()

            if (this.currentBotId || !this.bots || this.bots.length === 0) return

            const targetBot = this.getTargetBotForFloatingButton()
            if (targetBot) {
                const buttonText = `Abrir ${targetBot.name || 'Bot'}`
                this.createFloatingChatButton(targetBot, buttonText)
            }
        } catch (error) {
            console.error('Error updating floating chat button:', error)
        }
    }

    getTargetBotForFloatingButton() {
        if (this.lastMinimizedBotId && this.chatInstances[this.lastMinimizedBotId]) {
            return this.bots.find(b => b.id === this.lastMinimizedBotId)
        }
        return this.getDefaultBot()
    }

    removeFloatingButton() {
        try {
            const existingButton = document.getElementById('floating-chat-button')
            if (existingButton) existingButton.remove()
        } catch (error) {
            console.error('Error removing floating button:', error)
        }
    }

    createFloatingChatButton(bot, buttonText) {
        if (!bot) {
            console.error('Cannot create floating button: bot is null/undefined')
            return
        }

        try {
            const floatingButton = document.createElement('button')
            floatingButton.id = 'floating-chat-button'
            floatingButton.title = buttonText
            floatingButton.className = 'floating-chat-button floating-chat-button-right'
            floatingButton.setAttribute('data-testid', 'floating-chat-button')

            floatingButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `

            floatingButton.onclick = () => this.handleFloatingButtonClick(bot)
            document.body.appendChild(floatingButton)
        } catch (error) {
            console.error('Error creating floating chat button:', error)
        }
    }

    handleFloatingButtonClick(bot) {
        try {
            if (this.lastMinimizedBotId && this.chatInstances[this.lastMinimizedBotId]) {
                this.restoreChatInstance(this.lastMinimizedBotId)
            } else {
                this.openChatbase(bot.chatbaseId, bot.id)
            }
        } catch (error) {
            console.error('Error handling floating button click:', error)
        }
    }

    openChatbase(chatbotId, botId) {
        if (this.isTransitioning) {
            console.warn('Transition in progress, ignoring openChatbase call')
            return
        }

        if (!chatbotId || !botId) {
            console.error('Invalid chatbotId or botId provided to openChatbase')
            return
        }

        try {
            console.log(`Opening chatbase for bot: ${botId}`)
            this.currentBotId = botId
            this.updateFloatingChatButton()
        } catch (error) {
            console.error('Error opening chatbase:', error)
        }
    }

    minimizeChatInstance(botId) {
        if (!botId || !this.chatInstances[botId]) {
            console.error(`Cannot minimize: invalid botId or instance not found: ${botId}`)
            return
        }

        try {
            const instance = this.chatInstances[botId]
            if (instance.container && document.body.contains(instance.container)) {
                instance.container.style.display = 'none'
                instance.isVisible = false
                this.currentBotId = null
                this.lastMinimizedBotId = botId
                this.updateFloatingChatButton()
            } else {
                console.warn(`Container for bot ${botId} not found in DOM`)
            }
        } catch (error) {
            console.error(`Error minimizing chat instance for bot ${botId}:`, error)
        }
    }

    restoreChatInstance(botId) {
        if (!botId || !this.chatInstances[botId]) {
            console.error(`Cannot restore: invalid botId or instance not found: ${botId}`)
            return
        }

        try {
            const instance = this.chatInstances[botId]
            if (instance.container && document.body.contains(instance.container)) {
                instance.container.style.display = 'flex'
                instance.isVisible = true
                this.currentBotId = botId
                this.lastMinimizedBotId = null
                this.updateFloatingChatButton()
            } else {
                console.warn(`Container for bot ${botId} no longer exists, recreating...`)
                delete this.chatInstances[botId]
                const bot = this.bots.find(b => b.id === botId)
                if (bot) {
                    this.openChatbase(bot.chatbaseId, botId)
                }
            }
        } catch (error) {
            console.error(`Error restoring chat instance for bot ${botId}:`, error)
        }
    }

    cleanupAllInstances() {
        try {
            Object.keys(this.chatInstances).forEach(botId => {
                const instance = this.chatInstances[botId]
                if (instance.container) {
                    instance.container.remove()
                }
                delete this.chatInstances[botId]
            })
            this.currentBotId = null
            this.lastMinimizedBotId = null
        } catch (error) {
            console.error('Error cleaning up instances:', error)
        }
    }

    validateImportData(importedData) {
        try {
            if (!Array.isArray(importedData)) {
                alert('El archivo JSON debe contener un array de bots')
                return false
            }

            if (importedData.length === 0) {
                alert('El archivo JSON está vacío')
                return false
            }

            if (importedData.length > 100) {
                alert('El archivo contiene demasiados bots (máximo 100)')
                return false
            }

            const isValidData = importedData.every((bot, index) => {
                if (!bot || typeof bot !== 'object') {
                    console.error(`Bot at index ${index} is not a valid object`)
                    return false
                }

                const requiredFields = ['id', 'name', 'description', 'chatbaseId']
                for (const field of requiredFields) {
                    if (typeof bot[field] !== 'string' || bot[field].trim() === '') {
                        console.error(`Bot at index ${index} has invalid ${field}`)
                        return false
                    }
                }

                if (bot.avatar !== null && typeof bot.avatar !== 'string') {
                    console.error(`Bot at index ${index} has invalid avatar`)
                    return false
                }

                if (typeof bot.isDefault !== 'boolean') {
                    console.error(`Bot at index ${index} has invalid isDefault`)
                    return false
                }

                return true
            })

            if (!isValidData) {
                alert(
                    'El archivo JSON contiene datos inválidos. Revisa la consola para más detalles.'
                )
                return false
            }

            return true
        } catch (error) {
            console.error('Error validating import data:', error)
            alert('Error al validar los datos importados')
            return false
        }
    }

    isMobile() {
        try {
            return window.innerWidth <= 768
        } catch (error) {
            console.error('Error checking mobile viewport:', error)
            return false
        }
    }

    handleModalClick(event) {
        try {
            const modal = document.getElementById('configModal')
            if (event.target === modal) {
                this.closeConfig()
            }
        } catch (error) {
            console.error('Error handling modal click:', error)
        }
    }

    closeConfig() {
        try {
            const modal = document.getElementById('configModal')
            if (!modal) {
                throw new Error('Config modal not found')
            }
            modal.classList.remove('active')
        } catch (error) {
            console.error('Error closing config modal:', error)
        }
    }
}

describe('Edge Cases and Error Handling', () => {
    let manager

    beforeEach(() => {
        // Clean DOM
        document.body.innerHTML = `
      <div class="container">
        <div class="experts-grid" id="expertsGrid"></div>
      </div>
      <div class="modal" id="configModal">
        <div class="modal-content"></div>
      </div>
    `

        manager = new mockChatbaseManagerClass()
    })

    describe('DOM Edge Cases', () => {
        it('should handle missing DOM elements gracefully', () => {
            // Remove the expertsGrid element
            document.getElementById('expertsGrid').remove()

            manager.bots = mockBots

            // Should not throw error
            expect(() => manager.renderExperts()).not.toThrow()
            expect(console.warn).toHaveBeenCalledWith('expertsGrid element not found')
        })

        it('should handle malformed DOM structure', () => {
            const grid = document.getElementById('expertsGrid')
            // Make appendChild fail by making it read-only
            Object.defineProperty(grid, 'appendChild', {
                value: () => {
                    throw new Error('DOM error')
                },
                writable: false,
            })

            manager.bots = mockBots

            expect(() => manager.renderExperts()).not.toThrow()
            expect(console.error).toHaveBeenCalledWith(
                'Error rendering experts:',
                expect.any(Error)
            )
        })

        it('should sanitize bot data to prevent XSS', () => {
            const maliciousBot = {
                id: 'malicious-bot',
                name: '<script>alert("xss")</script>Malicious Bot',
                description: '<img src="x" onerror="alert(1)">Description',
                chatbaseId: 'MAL123',
                avatar: null,
                isDefault: false,
            }

            manager.bots = [maliciousBot]
            manager.renderExperts()

            const expertCard = document.querySelector('[data-testid="expert-card-malicious-bot"]')
            expect(expertCard.innerHTML).not.toContain('<script>')
            expect(expertCard.innerHTML).toContain('&lt;script&gt;')
            // Note: onerror in attributes gets HTML-encoded but may still appear as text
            expect(expertCard.innerHTML).toContain('&lt;img')
        })
    })

    describe('Data Validation Edge Cases', () => {
        it('should handle null/undefined bot data', () => {
            expect(() => manager.createExpertCard(null)).toThrow(
                'Invalid bot data provided to createExpertCard'
            )
            expect(() => manager.createExpertCard(undefined)).toThrow(
                'Invalid bot data provided to createExpertCard'
            )
            expect(() => manager.createExpertCard({})).not.toThrow()
        })

        it('should handle empty bot names gracefully', () => {
            const initials1 = manager.getInitials('')
            const initials2 = manager.getInitials(null)
            const initials3 = manager.getInitials(undefined)

            expect(initials1).toBe('?')
            expect(initials2).toBe('?')
            expect(initials3).toBe('?')
        })

        it('should handle special characters in bot names', () => {
            const initials1 = manager.getInitials('María José Pérez-López')
            const initials2 = manager.getInitials('   Spaces   Around   ')
            const initials3 = manager.getInitials('123 456')

            expect(initials1).toBe('MJ')
            expect(initials2).toBe('SA')
            expect(initials3).toBe('14')
        })

        it('should handle very long names', () => {
            const longName = 'A'.repeat(1000)
            const initials = manager.getInitials(longName)

            expect(initials.length).toBeLessThanOrEqual(2)
        })

        it('should validate import data size limits', () => {
            const emptyArray = []
            const tooManyBots = Array(101)
                .fill()
                .map((_, i) => ({
                    id: `bot-${i}`,
                    name: `Bot ${i}`,
                    description: `Description ${i}`,
                    chatbaseId: `CHAT${i}`,
                    avatar: null,
                    isDefault: false,
                }))

            expect(manager.validateImportData(emptyArray)).toBe(false)
            expect(alert).toHaveBeenCalledWith('El archivo JSON está vacío')

            expect(manager.validateImportData(tooManyBots)).toBe(false)
            expect(alert).toHaveBeenCalledWith('El archivo contiene demasiados bots (máximo 100)')
        })

        it('should validate individual bot data thoroughly', () => {
            const invalidBots = [
                {
                    id: '',
                    name: 'Valid Name',
                    description: 'Valid',
                    chatbaseId: 'VALID',
                    avatar: null,
                    isDefault: false,
                },
                {
                    id: 'valid',
                    name: '',
                    description: 'Valid',
                    chatbaseId: 'VALID',
                    avatar: null,
                    isDefault: false,
                },
                {
                    id: 'valid',
                    name: 'Valid',
                    description: '',
                    chatbaseId: 'VALID',
                    avatar: null,
                    isDefault: false,
                },
                {
                    id: 'valid',
                    name: 'Valid',
                    description: 'Valid',
                    chatbaseId: '',
                    avatar: null,
                    isDefault: false,
                },
                {
                    id: 'valid',
                    name: 'Valid',
                    description: 'Valid',
                    chatbaseId: 'VALID',
                    avatar: 123,
                    isDefault: false,
                },
                {
                    id: 'valid',
                    name: 'Valid',
                    description: 'Valid',
                    chatbaseId: 'VALID',
                    avatar: null,
                    isDefault: 'yes',
                },
            ]

            expect(manager.validateImportData(invalidBots)).toBe(false)
            expect(alert).toHaveBeenCalledWith(
                'El archivo JSON contiene datos inválidos. Revisa la consola para más detalles.'
            )
        })
    })

    describe('Chat Instance Edge Cases', () => {
        beforeEach(() => {
            manager.bots = mockBots
        })

        it('should handle opening chat with invalid data', () => {
            expect(() => manager.openChatbase('', '')).not.toThrow()
            expect(() => manager.openChatbase(null, null)).not.toThrow()
            expect(() => manager.openChatbase(undefined, undefined)).not.toThrow()

            expect(console.error).toHaveBeenCalledWith(
                'Invalid chatbotId or botId provided to openChatbase'
            )
        })

        it('should handle transition state correctly', () => {
            manager.isTransitioning = true

            manager.openChatbase('VALID123', 'valid-bot')

            expect(console.warn).toHaveBeenCalledWith(
                'Transition in progress, ignoring openChatbase call'
            )
            expect(manager.currentBotId).toBeNull()
        })

        it('should handle minimizing non-existent instances', () => {
            expect(() => manager.minimizeChatInstance('non-existent')).not.toThrow()
            expect(() => manager.minimizeChatInstance(null)).not.toThrow()
            expect(() => manager.minimizeChatInstance('')).not.toThrow()

            expect(console.error).toHaveBeenCalledWith(
                'Cannot minimize: invalid botId or instance not found: non-existent'
            )
        })

        it('should handle restoring non-existent instances', () => {
            expect(() => manager.restoreChatInstance('non-existent')).not.toThrow()
            expect(console.error).toHaveBeenCalledWith(
                'Cannot restore: invalid botId or instance not found: non-existent'
            )
        })

        it('should handle orphaned chat instances', () => {
            // Create a chat instance with a container that gets removed from DOM
            const mockContainer = document.createElement('div')
            manager.chatInstances['test-bot'] = {
                container: mockContainer,
                isVisible: true,
            }

            // Container is not in DOM
            expect(document.body.contains(mockContainer)).toBe(false)

            // Should recreate instance instead of throwing error
            expect(() => manager.restoreChatInstance('test-bot')).not.toThrow()
            expect(console.warn).toHaveBeenCalledWith(
                'Container for bot test-bot no longer exists, recreating...'
            )
        })
    })

    describe('Floating Button Edge Cases', () => {
        it('should handle floating button creation with null bot', () => {
            expect(() => manager.createFloatingChatButton(null, 'Test')).not.toThrow()
            expect(console.error).toHaveBeenCalledWith(
                'Cannot create floating button: bot is null/undefined'
            )
        })

        it('should handle floating button removal when not present', () => {
            expect(() => manager.removeFloatingButton()).not.toThrow()
        })

        it('should handle floating button creation failure', () => {
            // Mock createElement to fail
            const originalCreateElement = document.createElement
            document.createElement = vi.fn(() => {
                throw new Error('DOM creation failed')
            })

            expect(() => manager.createFloatingChatButton(mockBots[0], 'Test')).not.toThrow()
            expect(console.error).toHaveBeenCalledWith(
                'Error creating floating chat button:',
                expect.any(Error)
            )

            // Restore original function
            document.createElement = originalCreateElement
        })

        it('should handle floating button click errors', () => {
            const botWithError = { ...mockBots[0] }

            // Mock console.error to capture the error
            const _errorSpy = vi.spyOn(console, 'error')

            // Create a scenario that would cause an error in handleFloatingButtonClick
            manager.lastMinimizedBotId = 'invalid-bot'
            manager.chatInstances['invalid-bot'] = null // This will cause an error

            expect(() => manager.handleFloatingButtonClick(botWithError)).not.toThrow()
        })
    })

    describe('LocalStorage Edge Cases', () => {
        it('should handle localStorage quota exceeded', () => {
            const originalSetItem = localStorage.setItem
            localStorage.setItem = vi.fn(() => {
                throw new Error('Quota exceeded')
            })

            manager.bots = mockBots

            expect(() => manager.saveBots()).not.toThrow()

            // Restore original function
            localStorage.setItem = originalSetItem
        })

        it('should handle corrupted localStorage data', () => {
            localStorage.getItem.mockReturnValue('{"invalid": json"}')

            expect(() => manager.loadBots()).not.toThrow()
            expect(manager.bots).toEqual([])
            expect(console.error).toHaveBeenCalledWith('Error loading bots:', expect.any(Error))
        })

        it('should handle localStorage being disabled', () => {
            const originalLocalStorage = window.localStorage
            delete window.localStorage

            expect(() => manager.loadBots()).not.toThrow()
            expect(manager.bots).toEqual([])

            // Restore localStorage
            window.localStorage = originalLocalStorage
        })
    })

    describe('Viewport and Responsive Edge Cases', () => {
        it('should handle viewport detection errors', () => {
            // Mock window.innerWidth to throw
            Object.defineProperty(window, 'innerWidth', {
                get: () => {
                    throw new Error('Viewport error')
                },
                configurable: true,
            })

            expect(manager.isMobile()).toBe(false)
            expect(console.error).toHaveBeenCalledWith(
                'Error checking mobile viewport:',
                expect.any(Error)
            )
        })

        it('should handle extreme viewport sizes', () => {
            Object.defineProperty(window, 'innerWidth', { value: 0, configurable: true })
            expect(manager.isMobile()).toBe(true)

            Object.defineProperty(window, 'innerWidth', { value: 999999, configurable: true })
            expect(manager.isMobile()).toBe(false)
        })
    })

    describe('Event Handling Edge Cases', () => {
        it('should handle modal click with missing modal element', () => {
            document.getElementById('configModal').remove()

            const event = createMockClickEvent(document.body)
            expect(() => manager.handleModalClick(event)).not.toThrow()
        })

        it('should handle modal click with null event', () => {
            expect(() => manager.handleModalClick(null)).not.toThrow()
            expect(() => manager.handleModalClick(undefined)).not.toThrow()
        })

        it('should handle closeConfig with missing modal', () => {
            document.getElementById('configModal').remove()

            expect(() => manager.closeConfig()).not.toThrow()
            expect(console.error).toHaveBeenCalledWith(
                'Error closing config modal:',
                expect.any(Error)
            )
        })
    })

    describe('Memory Management', () => {
        it('should cleanup instances without errors', () => {
            // Create some mock instances
            manager.chatInstances = {
                bot1: { container: document.createElement('div') },
                bot2: { container: null },
                bot3: {
                    /* no container */
                },
            }

            expect(() => manager.cleanupAllInstances()).not.toThrow()
            expect(manager.chatInstances).toEqual({})
            expect(manager.currentBotId).toBeNull()
            expect(manager.lastMinimizedBotId).toBeNull()
        })

        it('should handle cleanup errors gracefully', () => {
            const mockContainer = {
                remove: () => {
                    throw new Error('Remove failed')
                },
            }

            manager.chatInstances = {
                'error-bot': { container: mockContainer },
            }

            expect(() => manager.cleanupAllInstances()).not.toThrow()
            expect(console.error).toHaveBeenCalledWith(
                'Error cleaning up instances:',
                expect.any(Error)
            )
        })
    })
})
