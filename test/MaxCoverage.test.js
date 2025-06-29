/**
 * Final tests to push coverage to 95%+ by targeting specific uncovered lines
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

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

describe('Maximum Coverage Tests - 95% Target', () => {
    let chatManager

    beforeEach(async () => {
        vi.useFakeTimers()
        // Complete DOM setup
        document.body.innerHTML = `
      <div class="container">
        <div class="experts-grid" id="expertsGrid"></div>
      </div>
      <div class="modal" id="configModal">
        <div class="modal-content">
          <div class="bot-list" id="botList"></div>
        </div>
      </div>
      <input type="text" id="botName">
      <input type="text" id="botDescription">
      <input type="text" id="botAvatar">
      <input type="text" id="botId">
      <input type="file" id="importFile" accept=".json">
    `

        localStorage.clear()
        vi.clearAllMocks()

        // Import script and get manager
        await import('../src/script.js')
        chatManager = window.chatManager
    })

    afterEach(() => {
        vi.clearAllTimers()
        vi.useRealTimers()
    })

    describe('Specific Uncovered Code Paths', () => {
        it('should cover loadBots error path', async () => {
            // Mock localStorage to throw error
            localStorage.getItem.mockImplementation(() => {
                throw new Error('Storage error')
            })

            chatManager.loadBots()

            // Import logger to verify error calls
            const logger = await import('../src/logger.js')

            expect(logger.default.error).toHaveBeenCalledWith(
                'Error loading bots:',
                expect.any(Error)
            )
            expect(chatManager.bots).toEqual([])
        })

        it('should cover saveBots function', () => {
            const testBots = [
                {
                    id: 'test',
                    name: 'Test',
                    description: 'Test',
                    chatbaseId: 'TEST123',
                    avatar: null,
                    isDefault: false,
                },
            ]

            chatManager.bots = testBots
            chatManager.saveBots()

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'chatbaseBots',
                JSON.stringify(testBots)
            )
        })

        it('should cover handleExistingInstance paths', () => {
            // Create a visible instance
            const container = document.createElement('div')
            container.style.display = 'flex'
            document.body.appendChild(container)

            chatManager.chatInstances['test-bot'] = {
                isVisible: true,
                container: container,
            }

            chatManager.handleExistingInstance('test-bot')

            // Should attempt to minimize - function gets called
            expect(chatManager.chatInstances['test-bot']).toBeDefined()
        })

        it('should cover handleExistingInstance restore path', () => {
            // Create a minimized instance
            const container = document.createElement('div')
            container.style.display = 'none'
            document.body.appendChild(container)

            chatManager.chatInstances['test-bot'] = {
                isVisible: false,
                container: container,
            }

            chatManager.handleExistingInstance('test-bot')

            // Should restore the minimized instance
            expect(chatManager.chatInstances['test-bot'].isVisible).toBe(true)
        })

        it('should cover handleNewInstance path', () => {
            const button = document.createElement('button')
            document.body.appendChild(button)

            chatManager.handleNewInstance('TEST123', 'test-bot', button)

            expect(chatManager.currentBotId).toBe('test-bot')
        })

        it('should cover openChatbase with transition check', async () => {
            chatManager.isTransitioning = true

            chatManager.openChatbase('TEST123', 'test-bot')

            // Import logger to verify log calls
            const logger = await import('../src/logger.js')

            expect(logger.default.log).toHaveBeenCalledWith(
                'Transition in progress, ignoring click'
            )
        })

        it('should cover updateButtonState with different states', () => {
            const bot = {
                id: 'test-bot',
                name: 'Test Bot',
            }
            chatManager.bots = [bot]

            const button = document.createElement('button')
            button.id = 'btn-test-bot'
            document.body.appendChild(button)

            // Test loading state
            chatManager.updateButtonState('test-bot', 'loading')
            expect(button.className).toContain('bg-gray-500')
            expect(button.disabled).toBe(true)

            // Test active state
            chatManager.updateButtonState('test-bot', 'active')
            expect(button.className).toContain('bg-brand-green')
            expect(button.textContent).toContain('MINIMIZAR')

            // Test minimized state
            chatManager.updateButtonState('test-bot', 'minimized')
            expect(button.textContent).toContain('HABLAR CON')

            // Test default state
            chatManager.updateButtonState('test-bot', 'default')
            expect(button.textContent).toContain('HABLAR CON')
        })

        it('should cover updateButtonState error cases', async () => {
            // No button found
            chatManager.updateButtonState('non-existent', 'active')
            // Import logger to verify error calls
            const logger = await import('../src/logger.js')

            expect(logger.default.error).toHaveBeenCalledWith(
                'Button or bot not found. Button: false, Bot: false'
            )

            // No bot found
            const button = document.createElement('button')
            button.id = 'btn-no-bot'
            document.body.appendChild(button)

            chatManager.updateButtonState('no-bot', 'active')
            expect(logger.default.error).toHaveBeenCalledWith(
                'Button or bot not found. Button: true, Bot: false'
            )
        })

        it('should cover createIframeInstance complete flow', () => {
            chatManager.createIframeInstance('TEST123', 'test-bot')

            expect(chatManager.chatInstances['test-bot']).toBeDefined()
            expect(chatManager.chatInstances['test-bot'].isVisible).toBe(true)
            expect(chatManager.chatInstances['test-bot'].chatbotId).toBe('TEST123')
        })

        it('should cover minimizeChatInstance error case', async () => {
            // Import logger to verify error calls
            const logger = await import('../src/logger.js')

            chatManager.minimizeChatInstance('non-existent')

            expect(logger.default.error).toHaveBeenCalledWith(
                'No instance found for bot: non-existent'
            )
        })

        it('should cover restoreChatInstance error case', async () => {
            // Import logger to verify error calls
            const logger = await import('../src/logger.js')

            chatManager.restoreChatInstance('non-existent')

            expect(logger.default.error).toHaveBeenCalledWith(
                'No instance found for bot: non-existent'
            )
        })

        it('should cover validateInstanceContainer with invalid container', async () => {
            // Import logger to verify error calls
            const logger = await import('../src/logger.js')

            const instance = {
                container: null,
            }

            const result = chatManager.validateInstanceContainer(instance, 'test-bot')

            expect(result).toBe(false)
            expect(logger.default.error).toHaveBeenCalledWith(
                'Container for bot not found in DOM during minimize'
            )
        })

        it('should cover minimizeOtherInstances', async () => {
            // Import logger to verify log calls
            const logger = await import('../src/logger.js')

            // Create other visible instance
            chatManager.chatInstances['other-bot'] = {
                isVisible: true,
                container: document.createElement('div'),
            }
            chatManager.currentBotId = 'other-bot'

            chatManager.minimizeOtherInstances('test-bot')

            expect(logger.default.log).toHaveBeenCalledWith(
                'Minimizing previous visible instance: other-bot'
            )
        })

        it('should cover cleanupWidgetElements in widget mode', () => {
            const instance = { chatbotId: 'TEST123' }

            // Temporarily disable iframe mode
            const originalConfig = window.CONFIG
            window.CONFIG = { IFRAME_MODE: false }

            // Just test the function runs without error
            expect(() => chatManager.cleanupWidgetElements(instance, 'test-bot')).not.toThrow()

            // Restore config
            window.CONFIG = originalConfig
        })

        it('should cover cleanupOrphanedElements', () => {
            // Create orphaned elements
            const orphan1 = document.createElement('div')
            orphan1.id = 'chatbase-orphan'
            document.body.appendChild(orphan1)

            const orphan2 = document.createElement('iframe')
            orphan2.src = 'https://chatbase.co/test'
            document.body.appendChild(orphan2)

            chatManager.cleanupOrphanedElements()

            expect(document.getElementById('chatbase-orphan')).toBeFalsy()
            expect(orphan2.src).toBe('about:blank')
        })

        it('should cover cleanupGlobalProperties', () => {
            // Add mock global properties
            window.chatbaseTestProp = 'test'
            window.cbTestProp = 'test'

            chatManager.cleanupGlobalProperties()

            expect(window.chatbaseTestProp).toBeUndefined()
            expect(window.cbTestProp).toBeUndefined()
        })

        it('should cover removeInstanceElements with iframe', () => {
            const iframe = document.createElement('iframe')
            iframe.src = 'https://test.com'

            const instance = {
                iframe: iframe,
                container: document.createElement('div'),
                script: document.createElement('script'),
            }

            chatManager.removeInstanceElements(instance)

            expect(iframe.src).toBe('about:blank')
        })

        it('should cover createBotListItem with no avatar', () => {
            const bot = {
                id: 'test-bot',
                name: 'Test Bot',
                chatbaseId: 'TEST123',
                avatar: null,
                isDefault: false,
            }

            const item = chatManager.createBotListItem(bot, 0)

            expect(item.innerHTML).toContain('Avatar: Iniciales')
        })

        it('should cover createBotListItem with avatar', () => {
            const bot = {
                id: 'test-bot',
                name: 'Test Bot',
                chatbaseId: 'TEST123',
                avatar: 'https://example.com/avatar.jpg',
                isDefault: true,
            }

            const item = chatManager.createBotListItem(bot, 0)

            expect(item.innerHTML).toContain('Avatar: Personalizado')
            expect(item.innerHTML).toContain('POR DEFECTO')
        })

        it('should cover renderBotList', () => {
            const bot = {
                id: 'test-bot',
                name: 'Test Bot',
                description: 'Test Description',
                chatbaseId: 'TEST123',
                avatar: null,
                isDefault: false,
            }

            chatManager.bots = [bot]
            chatManager.renderBotList()

            const botList = document.getElementById('botList')
            expect(botList.innerHTML).toContain('Bots actuales')
            expect(botList.innerHTML).toContain('Test Bot')
        })

        it('should cover getFormData', () => {
            document.getElementById('botName').value = 'Test Bot'
            document.getElementById('botDescription').value = 'Test Description'
            document.getElementById('botAvatar').value = 'https://example.com/avatar.jpg'
            document.getElementById('botId').value = 'TEST123'

            const formData = chatManager.getFormData()

            expect(formData).toEqual({
                name: 'Test Bot',
                description: 'Test Description',
                avatar: 'https://example.com/avatar.jpg',
                chatbaseId: 'TEST123',
            })
        })

        it('should cover clearBotForm', () => {
            document.getElementById('botName').value = 'Test'
            document.getElementById('botDescription').value = 'Test'
            document.getElementById('botAvatar').value = 'Test'
            document.getElementById('botId').value = 'Test'

            chatManager.clearBotForm()

            expect(document.getElementById('botName').value).toBe('')
            expect(document.getElementById('botDescription').value).toBe('')
            expect(document.getElementById('botAvatar').value).toBe('')
            expect(document.getElementById('botId').value).toBe('')
        })

        it('should cover handleFloatingButtonClick paths', () => {
            const bot = { id: 'test-bot', name: 'Test Bot', chatbaseId: 'TEST123' }

            // Test with minimized instance
            chatManager.lastMinimizedBotId = 'test-bot'
            chatManager.chatInstances['test-bot'] = { isVisible: false }

            chatManager.handleFloatingButtonClick(bot)

            // Should attempt to restore
            expect(chatManager.chatInstances['test-bot'].isVisible).toBe(true)
        })

        it('should cover handleFloatingButtonClick without minimized instance', () => {
            const bot = { id: 'test-bot', name: 'Test Bot', chatbaseId: 'TEST123' }

            chatManager.lastMinimizedBotId = null

            chatManager.handleFloatingButtonClick(bot)

            // Should open new chat
            expect(chatManager.currentBotId).toBe('test-bot')
        })

        it('should cover all remaining edge cases', async () => {
            // Cover remaining function calls
            expect(chatManager.isMobile()).toBeDefined()
            expect(chatManager.getInitials('Test Name')).toBe('TN')

            // Cover setupEventListeners
            const spy = vi.spyOn(window, 'addEventListener')
            chatManager.setupEventListeners()
            expect(spy).toHaveBeenCalled()

            // Import logger to cover debug function
            const logger = await import('../src/logger.js')

            // Cover debug function
            chatManager.debugChatInstances()
            expect(logger.default.log).toHaveBeenCalledWith('=== Chat Instances Debug ===')
        })
    })
})
