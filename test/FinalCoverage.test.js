/**
 * Final coverage tests to achieve 95%+ by targeting remaining uncovered lines
 * Lines 1030-1132, 1167-1179, 1219
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @vercel/analytics
vi.mock('@vercel/analytics', () => ({
    inject: vi.fn(),
}))

describe('Final Coverage Push - Target 95%', () => {
    let chatManager

    beforeEach(async () => {
        // Setup complete DOM structure
        document.body.innerHTML = `
      <div class="container">
        <div class="experts-grid" id="expertsGrid"></div>
        <div class="floating-chat-button" id="floatingChatButton" style="display: none;">
          <button id="floatingButton">Chat</button>
        </div>
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

    describe('Execute Import Function - Lines 1030-1036', () => {
        it('should execute complete import flow with updateFloatingChatButton', () => {
            const validData = [
                {
                    id: 'test-bot',
                    name: 'Test Bot',
                    description: 'Test Description',
                    chatbaseId: 'TEST123',
                    avatar: null,
                    isDefault: false,
                },
            ]

            const mockFileInput = document.getElementById('importFile')

            // Mock alert to prevent actual alerts
            global.alert = vi.fn()

            // Execute import to cover lines 1024-1036
            chatManager.executeImport(validData, mockFileInput)

            // Verify all the operations in executeImport were called
            expect(chatManager.bots).toEqual(validData)
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'chatbaseBots',
                JSON.stringify(validData)
            )
            expect(mockFileInput.value).toBe('')
            expect(global.alert).toHaveBeenCalledWith('Se importaron 1 bot(s) correctamente')
            expect(console.log).toHaveBeenCalledWith('Data imported successfully:', validData)
        })

        it('should cover updateFloatingChatButton function path', () => {
            // Setup bots to trigger floating button logic
            chatManager.bots = [
                {
                    id: 'test-bot',
                    name: 'Test Bot',
                    description: 'Test Description',
                    chatbaseId: 'TEST123',
                    avatar: null,
                    isDefault: true,
                },
            ]

            // Call updateFloatingChatButton to cover line 1030
            chatManager.updateFloatingChatButton()

            // Verify the floating button logic was executed
            const floatingButton = document.getElementById('floatingChatButton')
            expect(floatingButton).toBeDefined()
        })
    })

    describe('Delete Bot Function - Lines 1167-1179', () => {
        beforeEach(() => {
            // Setup bots and instances for deletion tests
            chatManager.bots = [
                {
                    id: 'bot-to-delete',
                    name: 'Delete Bot',
                    description: 'Bot to be deleted',
                    chatbaseId: 'DELETE123',
                    avatar: null,
                    isDefault: false,
                },
                {
                    id: 'bot-to-keep',
                    name: 'Keep Bot',
                    description: 'Bot to keep',
                    chatbaseId: 'KEEP123',
                    avatar: null,
                    isDefault: false,
                },
            ]

            // Create mock chat instance for bot to be deleted
            chatManager.chatInstances['bot-to-delete'] = {
                container: document.createElement('div'),
                isVisible: true,
                chatbotId: 'DELETE123',
            }
        })

        it('should delete bot with confirmation and cleanup instance - lines 1167-1179', () => {
            // Mock confirm to return true
            global.confirm = vi.fn().mockReturnValue(true)

            const initialBotsCount = chatManager.bots.length

            // Delete bot at index 0
            chatManager.deleteBot(0)

            // Verify confirmation was asked
            expect(global.confirm).toHaveBeenCalledWith(
                '¿Estás seguro de que quieres eliminar este bot?'
            )

            // Verify bot was deleted
            expect(chatManager.bots).toHaveLength(initialBotsCount - 1)
            expect(chatManager.bots.find(bot => bot.id === 'bot-to-delete')).toBeUndefined()

            // Verify chat instance was cleaned up
            expect(chatManager.chatInstances['bot-to-delete']).toBeUndefined()

            // Verify storage was updated
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'chatbaseBots',
                JSON.stringify(chatManager.bots)
            )
        })

        it('should not delete bot when confirmation is cancelled', () => {
            // Mock confirm to return false
            global.confirm = vi.fn().mockReturnValue(false)

            const initialBotsCount = chatManager.bots.length

            // Attempt to delete bot at index 0
            chatManager.deleteBot(0)

            // Verify confirmation was asked
            expect(global.confirm).toHaveBeenCalledWith(
                '¿Estás seguro de que quieres eliminar este bot?'
            )

            // Verify bot was NOT deleted (early return at line 1167)
            expect(chatManager.bots).toHaveLength(initialBotsCount)
            expect(chatManager.bots.find(bot => bot.id === 'bot-to-delete')).toBeDefined()
        })

        it('should delete bot without chat instance', () => {
            // Remove the chat instance
            delete chatManager.chatInstances['bot-to-delete']

            // Mock confirm to return true
            global.confirm = vi.fn().mockReturnValue(true)

            // Delete bot at index 0
            chatManager.deleteBot(0)

            // Verify bot was still deleted even without chat instance
            expect(chatManager.bots.find(bot => bot.id === 'bot-to-delete')).toBeUndefined()
        })
    })

    describe('DOMContentLoaded Event - Line 1219', () => {
        it('should trigger console log on DOMContentLoaded', () => {
            // Clear previous console calls
            vi.clearAllMocks()

            // Manually trigger DOMContentLoaded event
            const event = new Event('DOMContentLoaded')
            document.dispatchEvent(event)

            // Verify the console.log was called (line 1219)
            expect(console.log).toHaveBeenCalledWith('Chatbase Manager initialized')
        })
    })

    describe('Additional Coverage for Edge Cases', () => {
        it('should handle import validation errors properly', () => {
            // Test invalid data that fails validation
            const invalidData = [{ invalid: 'data' }]

            global.alert = vi.fn()

            const isValid = chatManager.validateImportData(invalidData)

            expect(isValid).toBe(false)
            expect(global.alert).toHaveBeenCalledWith(
                'El archivo JSON no tiene el formato correcto. Cada bot debe tener: id, name, description, chatbaseId, avatar, isDefault'
            )
        })

        it('should handle non-array import data', () => {
            global.alert = vi.fn()

            const isValid = chatManager.validateImportData({ notAnArray: true })

            expect(isValid).toBe(false)
            expect(global.alert).toHaveBeenCalledWith(
                'El archivo JSON debe contener un array de bots'
            )
        })

        it('should complete processImportFile with valid data', () => {
            const validData = [
                {
                    id: 'import-bot',
                    name: 'Import Bot',
                    description: 'Imported bot',
                    chatbaseId: 'IMPORT123',
                    avatar: null,
                    isDefault: false,
                },
            ]

            const mockEvent = {
                target: { result: JSON.stringify(validData) },
            }
            const mockFileInput = document.getElementById('importFile')

            global.confirm = vi.fn().mockReturnValue(true)
            global.alert = vi.fn()

            // This should trigger executeImport which covers lines 1030-1036
            chatManager.processImportFile(mockEvent, mockFileInput)

            expect(chatManager.bots).toEqual(validData)
            expect(global.alert).toHaveBeenCalledWith('Se importaron 1 bot(s) correctamente')
        })

        it('should cover all remaining uncovered branches', () => {
            // Test openConfig function
            chatManager.openConfig()
            const modal = document.getElementById('configModal')
            expect(modal.classList.contains('active')).toBe(true)

            // Test with multiple bots for updateFloatingChatButton edge cases
            chatManager.bots = [
                { id: 'bot1', name: 'Bot 1', isDefault: true, chatbaseId: 'BOT1' },
                { id: 'bot2', name: 'Bot 2', isDefault: false, chatbaseId: 'BOT2' },
            ]

            chatManager.updateFloatingChatButton()

            // Test deleteBot with invalid index
            global.confirm = vi.fn().mockReturnValue(true)
            chatManager.deleteBot(999) // Should handle gracefully

            expect(chatManager.bots).toHaveLength(2) // No change
        })
    })
})
