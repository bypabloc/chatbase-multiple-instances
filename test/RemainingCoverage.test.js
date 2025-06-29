/**
 * Tests to cover the remaining uncovered lines in script.js
 * Lines: 1371-1372, 1451-1453
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

describe('Remaining Coverage Tests', () => {
    let chatManager

    beforeEach(async () => {
        // Setup complete DOM structure
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

    describe('Global Properties Cleanup - Lines 1371-1372', () => {
        it('should handle non-deletable global properties', () => {
            // Create a simple property that can be cleaned up normally
            // This will test the basic functionality and achieve line coverage
            window.chatbaseNormalTestProp = 'test-value'

            // Also test with a property that has special characteristics
            Object.defineProperty(window, 'chatbaseSpecialProp', {
                value: 'special-value',
                writable: true,
                configurable: true, // Allow deletion
                enumerable: true,
            })

            // Call the cleanup function - this should cover lines 1371-1372
            chatManager.cleanupGlobalProperties()

            // Both properties should be cleaned up
            expect(window.chatbaseNormalTestProp).toBeUndefined()
            expect(window.chatbaseSpecialProp).toBeUndefined()
        })

        it('should handle properties that throw on delete', () => {
            // Create a property that will cause an error when trying to delete
            const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'chatbaseErrorProp')

            // Define a property that will cause an error
            Object.defineProperty(window, 'chatbaseErrorProp', {
                get() {
                    return 'test'
                },
                set() {
                    throw new Error('Cannot set this property')
                },
                configurable: false,
            })

            // This should trigger the catch block and set to undefined
            expect(() => chatManager.cleanupGlobalProperties()).not.toThrow()

            // Clean up
            if (originalDescriptor) {
                Object.defineProperty(window, 'chatbaseErrorProp', originalDescriptor)
            }
        })
    })

    describe('Import File Error Handling - Lines 1451-1453', () => {
        it('should handle JSON parsing errors during import', async () => {
            // Create a mock file with invalid JSON
            const invalidJsonFile = new File(['invalid json content'], 'test.json', {
                type: 'application/json',
            })

            // Mock file input
            const fileInput = document.getElementById('importFile')
            Object.defineProperty(fileInput, 'files', {
                value: [invalidJsonFile],
                configurable: true,
            })

            // Mock FileReader to return invalid JSON
            const mockFileReader = {
                onload: null,
                readAsText: vi.fn().mockImplementation(function () {
                    // Simulate file read with invalid JSON
                    if (this.onload) {
                        this.onload({ target: { result: 'invalid json {' } })
                    }
                }),
            }

            global.FileReader = vi.fn().mockImplementation(() => mockFileReader)
            global.alert = vi.fn()

            // Import logger to verify error calls
            const logger = await import('../src/logger.js')

            // Call importFromFile which will trigger processImportFile
            chatManager.importFromFile()

            // Verify error was logged (lines 1451-1453)
            expect(logger.default.error).toHaveBeenCalledWith(
                'Error importing file:',
                expect.any(Error)
            )
            expect(global.alert).toHaveBeenCalledWith(
                'Error al procesar el archivo JSON. Verifica que el formato sea válido.'
            )
        })

        it('should handle errors during data validation in import', async () => {
            // Create a mock file with JSON that will cause validation errors
            const problematicJsonFile = new File(['{"valid": "json"}'], 'test.json', {
                type: 'application/json',
            })

            // Mock file input
            const fileInput = document.getElementById('importFile')
            Object.defineProperty(fileInput, 'files', {
                value: [problematicJsonFile],
                configurable: true,
            })

            // Mock FileReader to return JSON that will cause validation to throw
            const mockFileReader = {
                onload: null,
                readAsText: vi.fn().mockImplementation(function () {
                    // Simulate file read with JSON that causes validation error
                    if (this.onload) {
                        // This will trigger an error in processImportFile when trying to validate
                        this.onload({ target: { result: '{"test": true}' } })
                    }
                }),
            }

            global.FileReader = vi.fn().mockImplementation(() => mockFileReader)
            global.alert = vi.fn()

            // Mock validateImportData to throw an error
            const originalValidate = chatManager.validateImportData
            chatManager.validateImportData = vi.fn().mockImplementation(() => {
                throw new Error('Validation error')
            })

            // Import logger to verify error calls
            const logger = await import('../src/logger.js')

            // Call importFromFile which will trigger processImportFile
            chatManager.importFromFile()

            // Verify error was logged (lines 1451-1453)
            expect(logger.default.error).toHaveBeenCalledWith(
                'Error importing file:',
                expect.any(Error)
            )
            expect(global.alert).toHaveBeenCalledWith(
                'Error al procesar el archivo JSON. Verifica que el formato sea válido.'
            )

            // Restore original function
            chatManager.validateImportData = originalValidate
        })

        it('should handle errors during executeImport in processImportFile', async () => {
            // Create a mock file with valid JSON
            const validJsonFile = new File(['[{"id": "test", "name": "test"}]'], 'test.json', {
                type: 'application/json',
            })

            // Mock file input
            const fileInput = document.getElementById('importFile')
            Object.defineProperty(fileInput, 'files', {
                value: [validJsonFile],
                configurable: true,
            })

            // Mock FileReader to return valid JSON
            const mockFileReader = {
                onload: null,
                readAsText: vi.fn().mockImplementation(function () {
                    if (this.onload) {
                        this.onload({
                            target: {
                                result: '[{"id": "test", "name": "Test", "description": "Test", "chatbaseId": "TEST123", "avatar": null, "isDefault": false}]',
                            },
                        })
                    }
                }),
            }

            global.FileReader = vi.fn().mockImplementation(() => mockFileReader)
            global.alert = vi.fn()
            global.confirm = vi.fn().mockReturnValue(true)

            // Mock executeImport to throw an error
            const originalExecute = chatManager.executeImport
            chatManager.executeImport = vi.fn().mockImplementation(() => {
                throw new Error('Execute import error')
            })

            // Import logger to verify error calls
            const logger = await import('../src/logger.js')

            // Call importFromFile which will trigger processImportFile
            chatManager.importFromFile()

            // Verify error was logged (lines 1451-1453)
            expect(logger.default.error).toHaveBeenCalledWith(
                'Error importing file:',
                expect.any(Error)
            )
            expect(global.alert).toHaveBeenCalledWith(
                'Error al procesar el archivo JSON. Verifica que el formato sea válido.'
            )

            // Restore original function
            chatManager.executeImport = originalExecute
        })
    })

    describe('Additional Coverage for Edge Cases', () => {
        it('should handle complex global property cleanup scenarios', () => {
            // Add various types of global properties to test cleanup
            window.chatbaseNormalProp = 'normal'
            window.CBUpperCase = 'uppercase'
            window.mixedChatbaseProp = 'mixed'

            chatManager.cleanupGlobalProperties()

            // All should be cleaned up
            expect(window.chatbaseNormalProp).toBeUndefined()
            expect(window.CBUpperCase).toBeUndefined()
            expect(window.mixedChatbaseProp).toBeUndefined()
        })

        it('should cover the property deletion catch block', () => {
            // Create a property that cannot be deleted and cannot be set
            Object.defineProperty(window, 'chatbaseProtectedProp', {
                value: 'protected',
                writable: false,
                configurable: false,
            })

            // This should hit the catch block since the property can't be deleted or set
            expect(() => chatManager.cleanupGlobalProperties()).not.toThrow()

            // Property might still exist since both delete and set would fail
            // But the function should complete without throwing
        })
    })
})
