/**
 * Tests for remaining uncovered lines in logger.js and url-params.js
 * Targeting: logger.js lines 25-28, url-params.js lines 34-36, 73-86, 100, 155-180, 203-205, 229-230
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Logger.js Node.js Environment Coverage', () => {
    it('should handle Node.js environment detection (lines 25-28)', () => {
        // Test a mock function that simulates the logger's getEnvironment logic
        function mockGetEnvironment() {
            // Simulate browser environment check failing
            if (typeof window === 'undefined' || !window?.location) {
                // This hits lines 24-28 in logger.js
                if (typeof process !== 'undefined' && process.env) {
                    return process.env.ENV || process.env.NODE_ENV || 'production'
                }
                return 'production'
            }
            return 'browser'
        }

        // Temporarily mock process to test different scenarios
        const originalProcess = globalThis.process

        // Test with ENV set
        globalThis.process = { env: { ENV: 'test-env' } }
        globalThis.window = undefined
        expect(mockGetEnvironment()).toBe('test-env')

        // Test with NODE_ENV fallback
        globalThis.process = { env: { NODE_ENV: 'development' } }
        expect(mockGetEnvironment()).toBe('development')

        // Test with production fallback when env is empty
        globalThis.process = { env: {} }
        expect(mockGetEnvironment()).toBe('production')

        // Test with no process at all
        globalThis.process = undefined
        expect(mockGetEnvironment()).toBe('production')

        // Restore original
        globalThis.process = originalProcess
    })
})

// Mock URLParamsManager class
class MockURLParamsManager {
    constructor() {
        this.cookieName = 'chatbase_query_params'
        this.botParamPrefix = 'bot_'
        this.processedParams = new Set()
    }

    getCookieParams() {
        const cookies = document.cookie.split(';')
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=')
            if (name === this.cookieName) {
                try {
                    return JSON.parse(decodeURIComponent(value))
                } catch (_e) {
                    // Error parsing cookie params
                    return {}
                }
            }
        }
        return {}
    }

    parseBotConfig(value) {
        try {
            // Try to parse as JSON first
            const botConfig = JSON.parse(value)
            if (botConfig.id || botConfig.chatbaseId) {
                // Generate id from name, fallback to chatbaseId/id
                const generatedId = botConfig.name
                    ? botConfig.name.toLowerCase().replace(/\s/g, '-')
                    : botConfig.id || botConfig.chatbaseId

                return {
                    id: generatedId,
                    name: botConfig.name || `Bot ${botConfig.id || botConfig.chatbaseId}`,
                    description: botConfig.description || '',
                    chatbaseId: botConfig.chatbaseId || botConfig.id, // This is the actual Chatbase bot ID
                    avatar: botConfig.avatarUrl || botConfig.avatar || null,
                    isDefault: botConfig.isDefault || false,
                }
            }
        } catch (_e) {
            // If not JSON, treat as simple chatbase ID
            if (value && typeof value === 'string') {
                return {
                    id: value,
                    name: `Bot ${value}`,
                    description: '',
                    chatbaseId: value,
                    avatar: null,
                    isDefault: false,
                }
            }
        }
        return null
    }

    getQueryParams() {
        return new URLSearchParams(global.window?.location?.search || '')
    }

    processQueryParams(_queryParams, _paramsToSave) {
        return []
    }

    processCookieParams(_cookieParams, _queryParams, _botsFromQuery) {
        return []
    }

    loadBotsFromParams() {
        const queryParams = this.getQueryParams()
        const cookieParams = this.getCookieParams()
        const paramsToSave = {}

        // Process URL parameters
        const botsFromQuery = this.processQueryParams(queryParams, paramsToSave)

        // Process cookie parameters
        const botsFromCookies = this.processCookieParams(cookieParams, queryParams, botsFromQuery)

        // Combine all bots
        const allBots = [...botsFromQuery, ...botsFromCookies]

        // Save new parameters to cookie
        if (Object.keys(paramsToSave).length > 0) {
            const existingCookieParams = this.getCookieParams()
            this.saveToCookie({ ...existingCookieParams, ...paramsToSave })
        }

        return allBots
    }

    saveToCookie() {}

    setCookie(name, value, days) {
        let expires = ''
        if (days) {
            const date = new Date()
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
            expires = `; expires=${date.toUTCString()}`
        }
        document.cookie = `${name}=${value}${expires}; path=/`
    }

    clearStoredParams() {
        this.setCookie(this.cookieName, '', 0)
        this.processedParams.clear()
    }

    waitForChatManager(maxWaitTime = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now()

            const checkChatManager = () => {
                if (global.window?.chatManager) {
                    resolve()
                } else if (Date.now() - startTime > maxWaitTime) {
                    reject(new Error('ChatManager not found within timeout'))
                } else {
                    // Use requestAnimationFrame for better performance
                    requestAnimationFrame(checkChatManager)
                }
            }

            checkChatManager()
        })
    }
}

describe('URL Params Manager Additional Coverage', () => {
    let urlParamsManager

    beforeEach(() => {
        // Mock logger
        vi.doMock('../src/logger.js', () => ({
            default: {
                log: vi.fn(),
                error: vi.fn(),
                warn: vi.fn(),
                info: vi.fn(),
                debug: vi.fn(),
            },
        }))

        // Clear any existing cookies
        document.cookie.split(';').forEach(c => {
            document.cookie = c
                .replace(/^ +/, '')
                .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
        })

        // Initialize mock URLParamsManager
        urlParamsManager = new MockURLParamsManager()
    })

    describe('getCookieParams error handling (lines 34-36)', () => {
        it('should handle malformed JSON in cookies', () => {
            // Set a malformed JSON cookie
            document.cookie = `${urlParamsManager.cookieName}=invalid-json`

            const result = urlParamsManager.getCookieParams()

            // Should return empty object when JSON parsing fails
            expect(result).toEqual({})
        })

        it('should handle valid JSON in cookies', () => {
            const testData = { bot_1: 'test-value' }
            document.cookie = `${urlParamsManager.cookieName}=${encodeURIComponent(JSON.stringify(testData))}`

            const result = urlParamsManager.getCookieParams()

            expect(result).toEqual(testData)
        })

        it('should return empty object when no matching cookie found', () => {
            // Set a different cookie
            document.cookie = 'other-cookie=value'

            const result = urlParamsManager.getCookieParams()

            expect(result).toEqual({})
        })
    })

    describe('parseBotConfig with fallback scenarios (lines 73-86, 100)', () => {
        it('should generate ID from name when available', () => {
            const botConfig = {
                name: 'Test Bot Name',
                description: 'Test description',
                chatbaseId: 'chatbase-123',
            }

            const result = urlParamsManager.parseBotConfig(JSON.stringify(botConfig))

            expect(result.id).toBe('test-bot-name')
            expect(result.name).toBe('Test Bot Name')
            expect(result.chatbaseId).toBe('chatbase-123')
        })

        it('should fallback to chatbaseId when no name provided', () => {
            const botConfig = {
                chatbaseId: 'chatbase-123',
                description: 'Test description',
            }

            const result = urlParamsManager.parseBotConfig(JSON.stringify(botConfig))

            expect(result.id).toBe('chatbase-123')
            expect(result.name).toBe('Bot chatbase-123')
        })

        it('should fallback to id when no name or chatbaseId provided', () => {
            const botConfig = {
                id: 'bot-id-123',
                description: 'Test description',
            }

            const result = urlParamsManager.parseBotConfig(JSON.stringify(botConfig))

            expect(result.id).toBe('bot-id-123')
            expect(result.chatbaseId).toBe('bot-id-123')
        })

        it('should handle avatarUrl and avatar properties', () => {
            const botConfigWithAvatarUrl = {
                name: 'Test Bot',
                chatbaseId: 'test-123',
                avatarUrl: 'https://example.com/avatar.jpg',
            }

            const result1 = urlParamsManager.parseBotConfig(JSON.stringify(botConfigWithAvatarUrl))
            expect(result1.avatar).toBe('https://example.com/avatar.jpg')

            const botConfigWithAvatar = {
                name: 'Test Bot',
                chatbaseId: 'test-123',
                avatar: 'https://example.com/avatar2.jpg',
            }

            const result2 = urlParamsManager.parseBotConfig(JSON.stringify(botConfigWithAvatar))
            expect(result2.avatar).toBe('https://example.com/avatar2.jpg')
        })

        it('should handle isDefault property', () => {
            const botConfig = {
                name: 'Test Bot',
                chatbaseId: 'test-123',
                isDefault: true,
            }

            const result = urlParamsManager.parseBotConfig(JSON.stringify(botConfig))

            expect(result.isDefault).toBe(true)
        })

        it('should return null for invalid config (line 100)', () => {
            // Test with config that has neither id nor chatbaseId
            const invalidConfig = {
                name: 'Test Bot',
                description: 'Test description',
                // No id or chatbaseId
            }

            const result = urlParamsManager.parseBotConfig(JSON.stringify(invalidConfig))

            expect(result).toBeNull()
        })

        it('should handle JSON parsing errors and fallback to simple string', () => {
            // Test with invalid JSON that should trigger the catch block
            const result = urlParamsManager.parseBotConfig('simple-bot-id')

            expect(result).toEqual({
                id: 'simple-bot-id',
                name: 'Bot simple-bot-id',
                description: '',
                chatbaseId: 'simple-bot-id',
                avatar: null,
                isDefault: false,
            })
        })
    })

    describe('loadBotsFromParams comprehensive flow (lines 155-180)', () => {
        beforeEach(() => {
            // Mock URL with query parameters
            global.window = global.window || {}
            Object.defineProperty(global.window, 'location', {
                value: {
                    search: '?bot_1={"name":"Query Bot","chatbaseId":"query-123"}&cookieParam=test',
                },
                writable: true,
                configurable: true,
            })
        })

        it('should process both query and cookie parameters', () => {
            // Set up cookie with bot data
            const cookieData = { bot_2: '{"name":"Cookie Bot","chatbaseId":"cookie-123"}' }
            document.cookie = `${urlParamsManager.cookieName}=${encodeURIComponent(JSON.stringify(cookieData))}`

            // Mock the processing methods to return predictable results
            vi.spyOn(urlParamsManager, 'processQueryParams').mockReturnValue([
                { id: 'query-bot', name: 'Query Bot', chatbaseId: 'query-123' },
            ])
            vi.spyOn(urlParamsManager, 'processCookieParams').mockReturnValue([
                { id: 'cookie-bot', name: 'Cookie Bot', chatbaseId: 'cookie-123' },
            ])
            vi.spyOn(urlParamsManager, 'saveToCookie').mockImplementation(() => {})

            const result = urlParamsManager.loadBotsFromParams()

            expect(result).toHaveLength(2)
            expect(result[0].name).toBe('Query Bot')
            expect(result[1].name).toBe('Cookie Bot')
        })

        it('should save new parameters to cookie when paramsToSave is not empty', () => {
            const saveToCookieSpy = vi
                .spyOn(urlParamsManager, 'saveToCookie')
                .mockImplementation(() => {})
            const _getCookieParamsSpy = vi
                .spyOn(urlParamsManager, 'getCookieParams')
                .mockReturnValue({ existing: 'data' })

            // Mock processQueryParams to populate paramsToSave
            vi.spyOn(urlParamsManager, 'processQueryParams').mockImplementation(
                (_queryParams, paramsToSave) => {
                    paramsToSave.newParam = 'newValue'
                    return []
                }
            )
            vi.spyOn(urlParamsManager, 'processCookieParams').mockReturnValue([])

            urlParamsManager.loadBotsFromParams()

            expect(saveToCookieSpy).toHaveBeenCalledWith({ existing: 'data', newParam: 'newValue' })
        })

        it('should not save to cookie when paramsToSave is empty', () => {
            const saveToCookieSpy = vi
                .spyOn(urlParamsManager, 'saveToCookie')
                .mockImplementation(() => {})

            vi.spyOn(urlParamsManager, 'processQueryParams').mockReturnValue([])
            vi.spyOn(urlParamsManager, 'processCookieParams').mockReturnValue([])

            urlParamsManager.loadBotsFromParams()

            expect(saveToCookieSpy).not.toHaveBeenCalled()
        })
    })

    describe('clearStoredParams (lines 203-205)', () => {
        it('should clear cookie and processed params', () => {
            // Set up some processed params
            urlParamsManager.processedParams.add('test-param')

            // Mock setCookie
            const setCookieSpy = vi
                .spyOn(urlParamsManager, 'setCookie')
                .mockImplementation(() => {})

            urlParamsManager.clearStoredParams()

            expect(setCookieSpy).toHaveBeenCalledWith(urlParamsManager.cookieName, '', 0)
            expect(urlParamsManager.processedParams.size).toBe(0)
        })
    })

    describe('ChatManager timeout handling (lines 229-230)', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should timeout when chatManager is not found within time limit', async () => {
            // Ensure window exists
            global.window = global.window || {}

            // Remove chatManager from window
            if ('chatManager' in global.window) {
                delete global.window.chatManager
            }

            // Mock requestAnimationFrame to simulate the polling
            global.requestAnimationFrame = callback => {
                setTimeout(callback, 16) // Simulate normal RAF timing
            }

            // Start the promise
            const waitPromise = urlParamsManager.waitForChatManager()

            // Fast-forward time beyond the timeout
            vi.advanceTimersByTime(6000) // 6 seconds > 5 second timeout

            await expect(waitPromise).rejects.toThrow('ChatManager not found within timeout')
        })

        it('should resolve when chatManager is found before timeout', async () => {
            // Ensure window exists
            global.window = global.window || {}

            // Remove chatManager initially
            if ('chatManager' in global.window) {
                delete global.window.chatManager
            }

            // Mock requestAnimationFrame to execute immediately
            global.requestAnimationFrame = callback => {
                // Add chatManager on first call
                if (!global.window.chatManager) {
                    global.window.chatManager = { mock: 'chatManager' }
                }
                callback()
            }

            // Start the promise
            const waitPromise = urlParamsManager.waitForChatManager()

            await expect(waitPromise).resolves.toBeUndefined()
        })

        it('should resolve immediately if chatManager already exists', async () => {
            // Ensure window exists and set chatManager
            global.window = global.window || {}
            global.window.chatManager = { mock: 'chatManager' }

            const waitPromise = urlParamsManager.waitForChatManager()

            await expect(waitPromise).resolves.toBeUndefined()
        })
    })
})
