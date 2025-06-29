/**
 * Final coverage push to reach 95% by covering the last remaining lines
 * Lines 916-932, 938-946, 983-985
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @vercel/analytics
vi.mock('@vercel/analytics', () => ({
    inject: vi.fn(),
}))

describe('Final Coverage Push - Last Lines', () => {
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

    describe('ClearAllBots Function - Lines 916-932', () => {
        it('should clear all bots with confirmation', () => {
            // Setup some bots
            chatManager.bots = [
                {
                    id: 'bot1',
                    name: 'Bot 1',
                    description: 'First bot',
                    chatbaseId: 'BOT1',
                    avatar: null,
                    isDefault: false,
                },
                {
                    id: 'bot2',
                    name: 'Bot 2',
                    description: 'Second bot',
                    chatbaseId: 'BOT2',
                    avatar: null,
                    isDefault: true,
                },
            ]

            // Setup chat instances
            chatManager.chatInstances.bot1 = {
                container: document.createElement('div'),
                isVisible: true,
            }

            // Mock confirm to return true
            global.confirm = vi.fn().mockReturnValue(true)

            // Call clearAllBots
            chatManager.clearAllBots()

            // Verify confirmation was asked
            expect(global.confirm).toHaveBeenCalledWith(
                '¿Estás seguro de que quieres eliminar todos los bots? Esta acción no se puede deshacer.'
            )

            // Verify all bots were cleared
            expect(chatManager.bots).toEqual([])

            // Verify storage was updated
            expect(localStorage.setItem).toHaveBeenCalledWith('chatbaseBots', JSON.stringify([]))

            // Verify console log
            expect(console.log).toHaveBeenCalledWith('All bots deleted')

            // Verify chat instances were cleaned up
            expect(Object.keys(chatManager.chatInstances)).toHaveLength(0)
        })

        it('should not clear bots when confirmation is declined', () => {
            // Setup some bots
            chatManager.bots = [
                {
                    id: 'bot1',
                    name: 'Bot 1',
                    description: 'First bot',
                    chatbaseId: 'BOT1',
                    avatar: null,
                    isDefault: false,
                },
            ]

            // Mock confirm to return false
            global.confirm = vi.fn().mockReturnValue(false)

            const initialBotCount = chatManager.bots.length

            // Call clearAllBots
            chatManager.clearAllBots()

            // Verify confirmation was asked
            expect(global.confirm).toHaveBeenCalledWith(
                '¿Estás seguro de que quieres eliminar todos los bots? Esta acción no se puede deshacer.'
            )

            // Verify bots were NOT cleared (early return at line 917)
            expect(chatManager.bots).toHaveLength(initialBotCount)
        })

        it('should handle errors during clear all bots', () => {
            // Setup bots
            chatManager.bots = [{ id: 'test', name: 'Test' }]

            // Mock confirm to return true
            global.confirm = vi.fn().mockReturnValue(true)

            // Mock saveBots to throw error
            const originalSaveBots = chatManager.saveBots
            chatManager.saveBots = vi.fn().mockImplementation(() => {
                throw new Error('Storage error')
            })

            // Call clearAllBots
            chatManager.clearAllBots()

            // Verify error was logged (line 930)
            expect(console.error).toHaveBeenCalledWith('Error deleting bots:', expect.any(Error))

            // Restore original function
            chatManager.saveBots = originalSaveBots
        })
    })

    describe('ImportFromFile Function - Lines 938-946', () => {
        it('should import from file with valid file', () => {
            // Create a mock file
            const mockFile = new File(['{"test": "data"}'], 'test.json', {
                type: 'application/json',
            })

            // Mock file input
            const fileInput = document.getElementById('importFile')
            Object.defineProperty(fileInput, 'files', {
                value: [mockFile],
                configurable: true,
            })

            // Mock FileReader
            const mockFileReader = {
                onload: null,
                readAsText: vi.fn().mockImplementation(function () {
                    // Simulate successful file read
                    if (this.onload) {
                        this.onload({ target: { result: '[]' } })
                    }
                }),
            }

            global.FileReader = vi.fn().mockImplementation(() => mockFileReader)

            // Mock processImportFile
            chatManager.processImportFile = vi.fn()

            // Call importFromFile
            chatManager.importFromFile()

            // Verify FileReader was created and used
            expect(global.FileReader).toHaveBeenCalled()
            expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile)
        })

        it('should not import when file validation fails', () => {
            // Mock file input with no files
            const fileInput = document.getElementById('importFile')
            Object.defineProperty(fileInput, 'files', {
                value: [],
                configurable: true,
            })

            global.alert = vi.fn()

            // Call importFromFile - should return early due to validation failure
            chatManager.importFromFile()

            // Verify alert was shown for no file selected
            expect(global.alert).toHaveBeenCalledWith('Por favor selecciona un archivo JSON')
        })
    })

    describe('Additional Coverage - Remaining Functions', () => {
        it('should cover processImportFile with valid data path', () => {
            const validData = [
                {
                    id: 'test',
                    name: 'Test',
                    description: 'Test',
                    chatbaseId: 'TEST123',
                    avatar: null,
                    isDefault: false,
                },
            ]

            const mockEvent = {
                target: { result: JSON.stringify(validData) },
            }
            const mockFileInput = document.getElementById('importFile')

            global.confirm = vi.fn().mockReturnValue(false)

            // Call processImportFile - should execute successfully
            expect(() => chatManager.processImportFile(mockEvent, mockFileInput)).not.toThrow()
        })
    })

    describe('Additional Coverage for Remaining Branches', () => {
        it('should handle validateImportFile with various file types', () => {
            // Test with null file
            const result1 = chatManager.validateImportFile(null)
            expect(result1).toBe(false)

            // Test with wrong file type
            const wrongTypeFile = new File(['content'], 'test.txt', { type: 'text/plain' })
            global.alert = vi.fn()

            const result2 = chatManager.validateImportFile(wrongTypeFile)
            expect(result2).toBe(false)
            expect(global.alert).toHaveBeenCalledWith('El archivo debe ser de tipo JSON')

            // Test with correct file type
            const jsonFile = new File(['{}'], 'test.json', { type: 'application/json' })
            const result3 = chatManager.validateImportFile(jsonFile)
            expect(result3).toBe(true)
        })

        it('should cover all remaining edge cases', () => {
            // Ensure all helper functions are covered
            expect(typeof chatManager.getInitials('John Doe')).toBe('string')
            expect(chatManager.getInitials('John Doe')).toBe('JD')

            expect(typeof chatManager.isMobile()).toBe('boolean')

            // Test debug function
            chatManager.debugChatInstances()
            expect(console.log).toHaveBeenCalledWith('=== Chat Instances Debug ===')
        })
    })
})
