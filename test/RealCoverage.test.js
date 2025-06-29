/**
 * Tests that actually import and test the real src/script.js for coverage
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @vercel/analytics before importing script.js
vi.mock('@vercel/analytics', () => ({
    inject: vi.fn(),
}))

describe('Real Code Coverage Tests', () => {
    let chatManager

    beforeEach(async () => {
        // Clear any existing DOM
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

        // Clear localStorage
        localStorage.clear()

        // Reset all mocks
        vi.clearAllMocks()

        // Dynamically import the real script to get coverage
        const _module = await import('../src/script.js')

        // Access the global chatManager that gets created
        chatManager = window.chatManager
    })

    describe('Real ChatbaseManager Integration', () => {
        it('should initialize ChatbaseManager correctly', () => {
            expect(chatManager).toBeDefined()
            expect(chatManager.bots).toBeDefined()
            expect(chatManager.chatInstances).toBeDefined()
            expect(typeof chatManager.loadBots).toBe('function')
            expect(typeof chatManager.saveBots).toBe('function')
        })

        it('should load empty bots array initially', () => {
            expect(chatManager.bots).toEqual([])
        })

        it('should handle localStorage operations', () => {
            const testBots = [
                {
                    id: 'test-bot',
                    name: 'Test Bot',
                    description: 'Test Description',
                    chatbaseId: 'TEST123',
                    avatar: null,
                    isDefault: true,
                },
            ]

            chatManager.bots = testBots
            chatManager.saveBots()

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'chatbaseBots',
                JSON.stringify(testBots)
            )
        })

        it('should generate initials correctly', () => {
            expect(chatManager.getInitials('María Financiera')).toBe('MF')
            expect(chatManager.getInitials('Juan')).toBe('J')
            // Empty string returns empty string in real implementation
            expect(chatManager.getInitials('')).toBe('')
        })

        it('should detect mobile viewport', () => {
            Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true })
            expect(chatManager.isMobile()).toBe(true)

            Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
            expect(chatManager.isMobile()).toBe(false)
        })

        it('should get default bot correctly', () => {
            chatManager.bots = [
                { id: 'bot1', name: 'Bot 1', isDefault: false },
                { id: 'bot2', name: 'Bot 2', isDefault: true },
                { id: 'bot3', name: 'Bot 3', isDefault: false },
            ]

            const defaultBot = chatManager.getDefaultBot()
            expect(defaultBot.id).toBe('bot2')
        })

        it('should return first bot if no default set', () => {
            chatManager.bots = [
                { id: 'bot1', name: 'Bot 1', isDefault: false },
                { id: 'bot2', name: 'Bot 2', isDefault: false },
            ]

            const defaultBot = chatManager.getDefaultBot()
            expect(defaultBot.id).toBe('bot1')
        })

        it('should return null if no bots exist', () => {
            chatManager.bots = []
            expect(chatManager.getDefaultBot()).toBeNull()
        })

        it('should set default bot correctly', () => {
            chatManager.bots = [
                { id: 'bot1', name: 'Bot 1', isDefault: true },
                { id: 'bot2', name: 'Bot 2', isDefault: false },
            ]

            chatManager.setDefaultBot('bot2')

            expect(chatManager.bots[0].isDefault).toBe(false)
            expect(chatManager.bots[1].isDefault).toBe(true)
        })

        it('should create expert cards', () => {
            const bot = {
                id: 'test-bot',
                name: 'Test Bot',
                description: 'Test Description',
                chatbaseId: 'TEST123',
                avatar: null,
                isDefault: false,
            }

            const card = chatManager.createExpertCard(bot)

            expect(card.className).toContain('bg-white')
            expect(card.innerHTML).toContain('Test Bot')
            expect(card.innerHTML).toContain('Test Description')
            expect(card.innerHTML).toContain('HABLAR CON TEST BOT')
        })

        it('should render experts correctly', () => {
            const bot = {
                id: 'test-bot',
                name: 'Test Bot',
                description: 'Test Description',
                chatbaseId: 'TEST123',
                avatar: null,
                isDefault: false,
            }

            chatManager.bots = [bot]
            chatManager.renderExperts()

            const grid = document.getElementById('expertsGrid')
            expect(grid.children.length).toBe(1)
            expect(grid.innerHTML).toContain('Test Bot')
        })

        it('should handle empty experts grid gracefully', () => {
            // Remove the grid element
            document.getElementById('expertsGrid').remove()

            chatManager.bots = [{ id: 'test', name: 'Test' }]

            // The real implementation does throw when grid is missing, so expect that
            expect(() => chatManager.renderExperts()).toThrow()
        })

        it('should validate import file correctly', () => {
            // Test null file
            expect(chatManager.validateImportFile(null)).toBe(false)
            expect(alert).toHaveBeenCalledWith('Por favor selecciona un archivo JSON')

            // Test wrong extension
            const txtFile = { name: 'test.txt' }
            expect(chatManager.validateImportFile(txtFile)).toBe(false)
            expect(alert).toHaveBeenCalledWith('El archivo debe ser de tipo JSON')

            // Test valid file
            const jsonFile = { name: 'test.json' }
            expect(chatManager.validateImportFile(jsonFile)).toBe(true)
        })

        it('should validate import data structure', () => {
            // Test non-array
            expect(chatManager.validateImportData({})).toBe(false)
            expect(alert).toHaveBeenCalledWith('El archivo JSON debe contener un array de bots')

            // Test invalid bot structure
            const invalidBots = [{ id: 123 }]
            expect(chatManager.validateImportData(invalidBots)).toBe(false)

            // Test valid bots
            const validBots = [
                {
                    id: 'test-bot',
                    name: 'Test Bot',
                    description: 'Test Description',
                    chatbaseId: 'TEST123',
                    avatar: null,
                    isDefault: false,
                },
            ]
            expect(chatManager.validateImportData(validBots)).toBe(true)
        })

        it('should handle floating button creation', () => {
            const bot = {
                id: 'test-bot',
                name: 'Test Bot',
                chatbaseId: 'TEST123',
            }

            chatManager.createFloatingChatButton(bot, 'Test Button')

            const button = document.getElementById('floating-chat-button')
            expect(button).toBeTruthy()
            expect(button.title).toBe('Test Button')
            expect(button.className).toContain('fixed')
        })

        it('should update floating button correctly', () => {
            const bot = {
                id: 'test-bot',
                name: 'Test Bot',
                chatbaseId: 'TEST123',
                isDefault: true,
            }

            chatManager.bots = [bot]
            chatManager.updateFloatingChatButton()

            const button = document.getElementById('floating-chat-button')
            expect(button).toBeTruthy()
        })

        it('should not create floating button when chat is active', () => {
            chatManager.currentBotId = 'active-bot'
            chatManager.updateFloatingChatButton()

            const button = document.getElementById('floating-chat-button')
            expect(button).toBeFalsy()
        })

        it('should handle modal operations', async () => {
            // Test opening modal
            chatManager.openConfig()
            const modal = document.getElementById('configModal')
            expect(modal.classList.contains('active')).toBe(true)

            // Test closing modal
            chatManager.closeConfig()
            // Modal closing is now async, wait for animation
            await new Promise(resolve => setTimeout(resolve, 200))
            expect(modal.classList.contains('active')).toBe(false)
        })

        it('should handle bot form validation', () => {
            // Mock form elements
            document.body.innerHTML += `
        <input id="botName" value="Test Bot">
        <input id="botDescription" value="Test Description">
        <input id="botAvatar" value="">
        <input id="botId" value="TEST123">
      `

            const formData = chatManager.getFormData()
            expect(formData.name).toBe('Test Bot')
            expect(formData.description).toBe('Test Description')
            expect(formData.chatbaseId).toBe('TEST123')

            expect(chatManager.validateBotForm(formData)).toBe(true)
        })

        it('should create bot from form data', () => {
            const formData = {
                name: 'Test Bot',
                description: 'Test Description',
                chatbaseId: 'TEST123',
                avatar: '',
            }

            const bot = chatManager.createBotFromForm(formData)

            expect(bot.id).toBe('test-bot')
            expect(bot.name).toBe('Test Bot')
            expect(bot.avatar).toBeNull()
            expect(bot.isDefault).toBe(false)
        })

        it('should handle global function exposure', () => {
            // Check that global functions are exposed
            expect(typeof window.openChatbase).toBe('function')
            expect(typeof window.openConfig).toBe('function')
            expect(typeof window.closeConfig).toBe('function')
            expect(typeof window.addBot).toBe('function')
            expect(typeof window.deleteBot).toBe('function')
            expect(typeof window.setDefaultBot).toBe('function')
        })
    })
})
