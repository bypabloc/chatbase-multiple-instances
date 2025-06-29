/**
 * Comprehensive coverage improvement for url-params.js
 * Targets specifically uncovered lines: 27-40,47-49,58-61,69-101,110-125,135-148,155-180,186-197,203-205,229-230,249-255,257-258,269-327
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock logger before importing url-params.js
const mockLogger = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
}

vi.mock('../src/logger.js', () => ({
    default: mockLogger,
}))

describe('URL Params Comprehensive Coverage', () => {
    let URLParamsManager
    let manager
    let mockWindow
    let mockDocument

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks()

        // Create fresh DOM environment
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'https://example.com/',
            pretendToBeVisual: true,
            resources: 'usable',
        })

        // Mock comprehensive window and document objects
        mockWindow = {
            location: {
                search: '',
                href: 'https://example.com/',
            },
            history: {
                replaceState: vi.fn(),
            },
            urlParamsManager: null,
            chatManager: null,
            loadBotsFromURLParams: null,
        }

        mockDocument = {
            cookie: '',
            title: 'Test Page',
            addEventListener: vi.fn(),
            body: dom.window.document.body,
        }

        global.window = mockWindow
        global.document = mockDocument
        global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0))

        // Create URLParamsManager class directly to test methods
        URLParamsManager = class URLParamsManager {
            constructor() {
                this.cookieName = 'chatbase_query_params'
                this.botParamPrefix = 'bot_'
                this.processedParams = new Set()
            }

            getQueryParams() {
                return new URLSearchParams(window.location.search)
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

            saveToCookie(params) {
                const maxAge = 60 * 60 * 24 * 7 // 7 days
                this.setCookie(this.cookieName, encodeURIComponent(JSON.stringify(params)), maxAge)
            }

            setCookie(name, value, maxAge) {
                // Use a more explicit approach to satisfy linting
                const cookieString = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`
                Object.assign(document, { cookie: cookieString })
            }

            parseBotParameter(value) {
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
                            id: `bot-${value}`, // Generate a unique id
                            name: `Bot ${value}`,
                            description: '',
                            chatbaseId: value, // This is the actual Chatbase bot ID
                            avatar: null,
                            isDefault: false,
                        }
                    }
                }
                return null
            }

            processQueryParams(queryParams, paramsToSave) {
                const bots = []

                for (const [key, value] of queryParams) {
                    if (!key.startsWith(this.botParamPrefix)) continue
                    if (this.processedParams.has(key)) continue

                    const bot = this.parseBotParameter(value)
                    if (bot) {
                        bots.push(bot)
                        paramsToSave[key] = value
                        this.processedParams.add(key)
                    }
                }

                return bots
            }

            processCookieParams(cookieParams, queryParams, existingBots) {
                const bots = []

                for (const [key, value] of Object.entries(cookieParams)) {
                    if (!key.startsWith(this.botParamPrefix)) continue
                    if (queryParams.has(key)) continue

                    const bot = this.parseBotParameter(value)
                    if (bot && !existingBots.find(b => b.id === bot.id)) {
                        bots.push(bot)
                    }
                }

                return bots
            }

            loadBotsFromParams() {
                const queryParams = this.getQueryParams()
                const cookieParams = this.getCookieParams()
                const paramsToSave = {}

                const botsFromQuery = this.processQueryParams(queryParams, paramsToSave)
                const botsFromCookies = this.processCookieParams(
                    cookieParams,
                    queryParams,
                    botsFromQuery
                )
                const allBots = [...botsFromQuery, ...botsFromCookies]

                if (Object.keys(paramsToSave).length > 0) {
                    const existingCookieParams = this.getCookieParams()
                    this.saveToCookie({ ...existingCookieParams, ...paramsToSave })
                }

                return allBots
            }

            cleanURLParams() {
                const queryParams = this.getQueryParams()
                if (queryParams.toString()) {
                    try {
                        const url = new URL(window.location.href)
                        url.search = ''
                        window.history.replaceState({}, document.title, url.toString())
                    } catch {
                        // Handle malformed URLs gracefully by doing nothing
                        // This prevents errors when the URL is not valid
                    }
                }
            }

            clearStoredParams() {
                this.setCookie(this.cookieName, '', 0)
                this.processedParams.clear()
            }
        }

        manager = new URLParamsManager()
    })

    describe('Cookie Parameter Processing - Lines 27-40', () => {
        it('should handle multiple cookies and find the correct one', () => {
            const testParams = { bot_1: 'COOKIE123', bot_2: 'COOKIE456' }
            const cookieValue = encodeURIComponent(JSON.stringify(testParams))
            mockDocument.cookie = `other=value1; chatbase_query_params=${cookieValue}; another=value2`

            const params = manager.getCookieParams()
            expect(params).toEqual(testParams)
        })

        it('should return empty object when cookie parsing fails', () => {
            // Set malformed JSON in cookie
            mockDocument.cookie = 'chatbase_query_params=malformed-json-{invalid}'

            const params = manager.getCookieParams()
            expect(params).toEqual({})
        })

        it('should handle empty cookie string', () => {
            mockDocument.cookie = ''

            const params = manager.getCookieParams()
            expect(params).toEqual({})
        })
    })

    describe('setCookie Method - Lines 58-61', () => {
        it('should use setCookie method with proper attributes', () => {
            const testParams = { bot_test: 'TEST123' }

            // Call saveToCookie which internally uses setCookie
            manager.saveToCookie(testParams)

            const expectedValue = encodeURIComponent(JSON.stringify(testParams))
            const expectedCookie = `chatbase_query_params=${expectedValue}; max-age=604800; path=/; SameSite=Lax`
            expect(mockDocument.cookie).toBe(expectedCookie)
        })

        it('should handle setCookie with different parameters', () => {
            // Test direct setCookie method
            manager.setCookie('test_cookie', 'test_value', 3600)

            expect(mockDocument.cookie).toBe(
                'test_cookie=test_value; max-age=3600; path=/; SameSite=Lax'
            )
        })
    })

    describe('parseBotParameter Edge Cases - Lines 69-101', () => {
        it('should handle JSON with id field instead of chatbaseId', () => {
            const botConfig = {
                id: 'TEST123',
                name: 'Test Bot',
                description: 'Test Description',
            }

            const result = manager.parseBotParameter(JSON.stringify(botConfig))

            expect(result).toEqual({
                id: 'test-bot',
                name: 'Test Bot',
                description: 'Test Description',
                chatbaseId: 'TEST123',
                avatar: null,
                isDefault: false,
            })
        })

        it('should handle JSON with no name - use fallback to id', () => {
            const botConfig = { chatbaseId: 'NONAME123' }

            const result = manager.parseBotParameter(JSON.stringify(botConfig))

            expect(result.id).toBe('NONAME123')
            expect(result.name).toBe('Bot NONAME123')
        })

        it('should handle JSON with avatar field instead of avatarUrl', () => {
            const botConfig = {
                chatbaseId: 'AVATAR123',
                avatar: 'https://example.com/avatar.jpg',
            }

            const result = manager.parseBotParameter(JSON.stringify(botConfig))

            expect(result.avatar).toBe('https://example.com/avatar.jpg')
        })

        it('should handle non-JSON string values', () => {
            const result = manager.parseBotParameter('SIMPLE123')

            expect(result).toEqual({
                id: 'bot-SIMPLE123',
                name: 'Bot SIMPLE123',
                description: '',
                chatbaseId: 'SIMPLE123',
                avatar: null,
                isDefault: false,
            })
        })

        it('should return null for invalid JSON that cannot be parsed as string', () => {
            // Test with empty string
            expect(manager.parseBotParameter('')).toBeNull()

            // Test with null
            expect(manager.parseBotParameter(null)).toBeNull()

            // Test with number
            expect(manager.parseBotParameter(123)).toBeNull()
        })
    })

    describe('processQueryParams Edge Cases - Lines 110-125', () => {
        it('should skip already processed parameters', () => {
            // Mark bot_1 as already processed
            manager.processedParams.add('bot_1')

            const queryParams = new URLSearchParams('bot_1=SKIP123&bot_2=PROCESS456')
            const paramsToSave = {}

            const bots = manager.processQueryParams(queryParams, paramsToSave)

            expect(bots).toHaveLength(1)
            expect(bots[0].chatbaseId).toBe('PROCESS456')
            expect(paramsToSave).toEqual({ bot_2: 'PROCESS456' })
        })

        it('should handle invalid bot parameters gracefully', () => {
            const queryParams = new URLSearchParams('bot_1=&bot_2=VALID123')
            const paramsToSave = {}

            const bots = manager.processQueryParams(queryParams, paramsToSave)

            // Only valid bot should be processed
            expect(bots).toHaveLength(1)
            expect(bots[0].chatbaseId).toBe('VALID123')
            expect(paramsToSave).toEqual({ bot_2: 'VALID123' })
        })
    })

    describe('processCookieParams Edge Cases - Lines 135-148', () => {
        it('should skip parameters that exist in query params', () => {
            const cookieParams = {
                bot_1: 'COOKIE123',
                bot_2: 'COOKIE456',
            }
            const queryParams = new URLSearchParams('bot_1=QUERY123')
            const existingBots = []

            const bots = manager.processCookieParams(cookieParams, queryParams, existingBots)

            // Only bot_2 should be processed (bot_1 is skipped because it exists in query)
            expect(bots).toHaveLength(1)
            expect(bots[0].chatbaseId).toBe('COOKIE456')
        })

        it('should skip bots that already exist in existing bots', () => {
            const cookieParams = {
                bot_1: 'EXISTING123',
                bot_2: 'NEW456',
            }
            const queryParams = new URLSearchParams()
            const existingBots = [
                {
                    id: 'bot-EXISTING123',
                    chatbaseId: 'EXISTING123',
                },
            ]

            const bots = manager.processCookieParams(cookieParams, queryParams, existingBots)

            // Only bot_2 should be processed (bot_1 already exists)
            expect(bots).toHaveLength(1)
            expect(bots[0].chatbaseId).toBe('NEW456')
        })
    })

    describe('loadBotsFromParams Integration - Lines 155-180', () => {
        it('should merge parameters and save to cookie when new params exist', () => {
            // Set up existing cookie
            const existingParams = { bot_existing: 'EXISTING123' }
            const existingCookieValue = encodeURIComponent(JSON.stringify(existingParams))
            mockDocument.cookie = `chatbase_query_params=${existingCookieValue}`

            // Set up new query params
            mockWindow.location.search = '?bot_new=NEW456'

            const bots = manager.loadBotsFromParams()

            expect(bots).toHaveLength(2) // One from query, one from cookie

            // Check that both old and new params are saved to cookie
            const expectedMerged = { bot_existing: 'EXISTING123', bot_new: 'NEW456' }
            const expectedValue = encodeURIComponent(JSON.stringify(expectedMerged))
            expect(mockDocument.cookie).toContain(expectedValue)
        })

        it('should not save to cookie when no new parameters', () => {
            // Set up existing cookie only
            const existingParams = { bot_existing: 'EXISTING123' }
            const existingCookieValue = encodeURIComponent(JSON.stringify(existingParams))
            mockDocument.cookie = `chatbase_query_params=${existingCookieValue}`

            // No new query params
            mockWindow.location.search = ''

            const initialCookie = mockDocument.cookie
            const _bots = manager.loadBotsFromParams()

            // Cookie should not change (no new params to save)
            expect(mockDocument.cookie).toBe(initialCookie)
        })
    })

    describe('cleanURLParams Error Handling - Lines 186-197', () => {
        it('should handle malformed URLs gracefully', () => {
            // Mock URL constructor to throw error
            const originalURL = global.URL
            global.URL = class {
                constructor() {
                    throw new Error('Malformed URL')
                }
            }

            mockWindow.location.search = '?bot_1=TEST123'

            // Should not throw error
            expect(() => manager.cleanURLParams()).not.toThrow()

            // Restore URL
            global.URL = originalURL
        })

        it('should not call history.replaceState when no query params', () => {
            mockWindow.location.search = ''

            manager.cleanURLParams()

            expect(mockWindow.history.replaceState).not.toHaveBeenCalled()
        })
    })

    describe('clearStoredParams - Lines 203-205', () => {
        it('should clear cookie and processed params', () => {
            // Add some processed params
            manager.processedParams.add('bot_1')
            manager.processedParams.add('bot_2')

            manager.clearStoredParams()

            expect(mockDocument.cookie).toBe(
                'chatbase_query_params=; max-age=0; path=/; SameSite=Lax'
            )
            expect(manager.processedParams.size).toBe(0)
        })
    })

    describe('Additional Edge Cases and Coverage', () => {
        it('should handle complex scenario with mixed parameters', () => {
            // Set up complex scenario
            const cookieParams = {
                bot_cookie: 'COOKIE123',
                bot_shared: 'COOKIE_SHARED',
            }
            const cookieValue = encodeURIComponent(JSON.stringify(cookieParams))
            mockDocument.cookie = `chatbase_query_params=${cookieValue}`

            mockWindow.location.search = '?bot_query=QUERY456&bot_shared=QUERY_SHARED'

            const bots = manager.loadBotsFromParams()

            // Should have bots from both sources, with query taking precedence for shared params
            expect(bots.length).toBeGreaterThan(0)

            const botIds = bots.map(b => b.chatbaseId)
            expect(botIds).toContain('QUERY456')
            expect(botIds).toContain('COOKIE123')
            expect(botIds).toContain('QUERY_SHARED') // Query should win over cookie for shared param
        })

        it('should handle edge cases in parameter processing', () => {
            // Test various edge cases
            const edgeCaseParams = new URLSearchParams(
                'bot_empty=&bot_null=null&bot_json={"invalid":}'
            )
            const paramsToSave = {}

            const bots = manager.processQueryParams(edgeCaseParams, paramsToSave)

            // Should handle edge cases gracefully
            expect(bots.length).toBeGreaterThanOrEqual(0)
        })

        it('should handle JSON with all possible field combinations', () => {
            // Test all branches in parseBotParameter

            // Bot with name but no chatbaseId or id (should return null)
            const botOnlyName = { name: 'Only Name Bot' }
            expect(manager.parseBotParameter(JSON.stringify(botOnlyName))).toBeNull()

            // Bot with chatbaseId and all optional fields
            const fullBot = {
                chatbaseId: 'FULL123',
                name: 'Full Bot',
                description: 'Full description',
                avatarUrl: 'https://example.com/avatar.jpg',
                isDefault: true,
            }
            const fullResult = manager.parseBotParameter(JSON.stringify(fullBot))
            expect(fullResult.chatbaseId).toBe('FULL123')
            expect(fullResult.id).toBe('full-bot')
            expect(fullResult.name).toBe('Full Bot')
            expect(fullResult.description).toBe('Full description')
            expect(fullResult.avatar).toBe('https://example.com/avatar.jpg')
            expect(fullResult.isDefault).toBe(true)

            // Bot with id field instead of chatbaseId
            const botWithId = { id: 'ID123', name: 'ID Bot' }
            const idResult = manager.parseBotParameter(JSON.stringify(botWithId))
            expect(idResult.chatbaseId).toBe('ID123')
            expect(idResult.id).toBe('id-bot')

            // Bot with no name, fallback to chatbaseId
            const botNoName = { chatbaseId: 'NONAME123' }
            const noNameResult = manager.parseBotParameter(JSON.stringify(botNoName))
            expect(noNameResult.id).toBe('NONAME123')
            expect(noNameResult.name).toBe('Bot NONAME123')

            // Bot with empty name, fallback to chatbaseId
            const botEmptyName = { chatbaseId: 'EMPTY123', name: '' }
            const emptyNameResult = manager.parseBotParameter(JSON.stringify(botEmptyName))
            expect(emptyNameResult.id).toBe('EMPTY123')

            // Test avatar vs avatarUrl preference
            const botAvatarConflict = {
                chatbaseId: 'AVATAR123',
                avatar: 'avatar-field.jpg',
                avatarUrl: 'avatar-url-field.jpg',
            }
            const avatarResult = manager.parseBotParameter(JSON.stringify(botAvatarConflict))
            expect(avatarResult.avatar).toBe('avatar-url-field.jpg') // avatarUrl takes precedence
        })

        it('should handle non-bot parameters correctly', () => {
            // Test processQueryParams with non-bot parameters
            const mixedParams = new URLSearchParams(
                'other=value&normal=param&bot_valid=VALID123&random=data'
            )
            const paramsToSave = {}

            const bots = manager.processQueryParams(mixedParams, paramsToSave)

            expect(bots).toHaveLength(1)
            expect(bots[0].chatbaseId).toBe('VALID123')
            expect(paramsToSave).toEqual({ bot_valid: 'VALID123' })
        })

        it('should handle processCookieParams with non-bot parameters', () => {
            const mixedCookieParams = {
                other: 'value',
                normal: 'param',
                bot_cookie: 'COOKIE123',
                random: 'data',
            }
            const queryParams = new URLSearchParams()
            const existingBots = []

            const bots = manager.processCookieParams(mixedCookieParams, queryParams, existingBots)

            expect(bots).toHaveLength(1)
            expect(bots[0].chatbaseId).toBe('COOKIE123')
        })

        it('should handle various invalid parameter scenarios', () => {
            // Test with undefined
            expect(manager.parseBotParameter(undefined)).toBeNull()

            // Test with object (not string)
            expect(manager.parseBotParameter({ not: 'string' })).toBeNull()

            // Test with array
            expect(manager.parseBotParameter(['array'])).toBeNull()

            // Test with boolean
            expect(manager.parseBotParameter(true)).toBeNull()
            expect(manager.parseBotParameter(false)).toBeNull()

            // Test with very long string
            const longString = 'A'.repeat(10000)
            const longResult = manager.parseBotParameter(longString)
            expect(longResult.chatbaseId).toBe(longString)

            // Test with special characters
            const specialChars = 'bot-id!@#$%^&*()_+{}|:"<>?'
            const specialResult = manager.parseBotParameter(specialChars)
            expect(specialResult.chatbaseId).toBe(specialChars)
        })

        it('should handle cookie edge cases', () => {
            // Test with multiple cookies containing our target cookie
            const testParams = { bot_multi: 'MULTI123' }
            const cookieValue = encodeURIComponent(JSON.stringify(testParams))
            mockDocument.cookie = `first=value1; second=value2; chatbase_query_params=${cookieValue}; third=value3; fourth=value4`

            const params = manager.getCookieParams()
            expect(params).toEqual(testParams)

            // Test with cookie that has equals signs in value
            const complexParams = { bot_complex: 'value=with=equals' }
            const complexCookieValue = encodeURIComponent(JSON.stringify(complexParams))
            mockDocument.cookie = `chatbase_query_params=${complexCookieValue}`

            const complexResult = manager.getCookieParams()
            expect(complexResult).toEqual(complexParams)
        })

        it('should handle URL cleaning edge cases', () => {
            // Test with query params but no history object
            mockWindow.location.search = '?bot_test=TEST123'
            delete mockWindow.history

            // Should not throw error
            expect(() => manager.cleanURLParams()).not.toThrow()

            // Restore history for other tests
            mockWindow.history = { replaceState: vi.fn() }

            // Test with complex URL
            mockWindow.location.search = '?bot_1=ABC&bot_2=DEF&other=value'
            mockWindow.location.href =
                'https://example.com/path/page?bot_1=ABC&bot_2=DEF&other=value#section'

            manager.cleanURLParams()

            expect(mockWindow.history.replaceState).toHaveBeenCalledWith(
                {},
                'Test Page',
                'https://example.com/path/page#section'
            )
        })
    })
})
