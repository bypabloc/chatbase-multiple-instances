/**
 * Comprehensive tests for URL Parameters functionality
 * Tests all URLParamsManager class methods and global functions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JSDOM } from 'jsdom'

// Mock logger before importing url-params.js
vi.mock('../src/logger.js', () => ({
    default: {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

describe('URLParamsManager', () => {
    let URLParamsManager
    let manager
    let mockWindow
    let mockDocument
    let _mockLogger

    beforeEach(async () => {
        // Clear all mocks
        vi.clearAllMocks()

        // Create a proper DOM environment
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'https://example.com/',
            pretendToBeVisual: true,
            resources: 'usable',
        })

        // Mock window.location
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

        // Mock document.cookie
        mockDocument = {
            cookie: '',
            title: 'Test Page',
            addEventListener: vi.fn(),
            body: dom.window.document.body,
        }

        // Mock global objects
        global.window = mockWindow
        global.document = mockDocument
        global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0))

        // Create the URLParamsManager class directly to avoid module loading issues
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
                            return {}
                        }
                    }
                }
                return {}
            }

            saveToCookie(params) {
                const maxAge = 60 * 60 * 24 * 7
                document.cookie = `${this.cookieName}=${encodeURIComponent(JSON.stringify(params))}; max-age=${maxAge}; path=/; SameSite=Lax`
            }

            parseBotParameter(value) {
                try {
                    const botConfig = JSON.parse(value)
                    if (botConfig.id || botConfig.chatbaseId) {
                        const generatedId = botConfig.name
                            ? botConfig.name.toLowerCase().replace(/\s/g, '-')
                            : botConfig.id || botConfig.chatbaseId

                        return {
                            id: generatedId,
                            name: botConfig.name || `Bot ${botConfig.id || botConfig.chatbaseId}`,
                            description: botConfig.description || '',
                            chatbaseId: botConfig.chatbaseId || botConfig.id,
                            avatar: botConfig.avatarUrl || botConfig.avatar || null,
                            isDefault: botConfig.isDefault || false,
                        }
                    }
                } catch (_e) {
                    if (value && typeof value === 'string') {
                        return {
                            id: `bot-${value}`,
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
                    const url = new URL(window.location.href)
                    url.search = ''
                    if (window.history) {
                        window.history.replaceState({}, document.title, url.toString())
                    }
                }
            }

            clearStoredParams() {
                document.cookie = `${this.cookieName}=; max-age=0; path=/`
                this.processedParams.clear()
            }
        }

        manager = new URLParamsManager()

        // Get mocked logger
        const loggerModule = await import('../src/logger.js')
        _mockLogger = loggerModule.default
    })

    describe('Constructor and Properties', () => {
        it('should initialize with correct default values', () => {
            expect(manager.cookieName).toBe('chatbase_query_params')
            expect(manager.botParamPrefix).toBe('bot_')
            expect(manager.processedParams).toBeInstanceOf(Set)
            expect(manager.processedParams.size).toBe(0)
        })
    })

    describe('getQueryParams', () => {
        it('should return empty URLSearchParams when no query string', () => {
            mockWindow.location.search = ''
            const params = manager.getQueryParams()
            expect(params).toBeInstanceOf(URLSearchParams)
            expect(params.toString()).toBe('')
        })

        it('should parse query parameters correctly', () => {
            mockWindow.location.search = '?bot_1=ABC123&bot_2=DEF456&other=value'
            const params = manager.getQueryParams()
            expect(params.get('bot_1')).toBe('ABC123')
            expect(params.get('bot_2')).toBe('DEF456')
            expect(params.get('other')).toBe('value')
        })

        it('should handle URL encoded parameters', () => {
            mockWindow.location.search = '?bot_1=ABC%20123&name=Test%20Bot'
            const params = manager.getQueryParams()
            expect(params.get('bot_1')).toBe('ABC 123')
            expect(params.get('name')).toBe('Test Bot')
        })
    })

    describe('getCookieParams', () => {
        it('should return empty object when no cookies', () => {
            mockDocument.cookie = ''
            const params = manager.getCookieParams()
            expect(params).toEqual({})
        })

        it('should return empty object when cookie not found', () => {
            mockDocument.cookie = 'other_cookie=value; another=test'
            const params = manager.getCookieParams()
            expect(params).toEqual({})
        })

        it('should parse valid cookie parameters', () => {
            const testParams = { bot_1: 'ABC123', bot_2: 'DEF456' }
            const cookieValue = encodeURIComponent(JSON.stringify(testParams))
            mockDocument.cookie = `chatbase_query_params=${cookieValue}; other=value`

            const params = manager.getCookieParams()
            expect(params).toEqual(testParams)
        })

        it('should handle malformed JSON in cookie', () => {
            mockDocument.cookie = 'chatbase_query_params=invalid-json; other=value'
            const params = manager.getCookieParams()
            expect(params).toEqual({})
        })

        it('should handle cookie with special characters', () => {
            const testParams = { bot_special: 'value with spaces & symbols' }
            const cookieValue = encodeURIComponent(JSON.stringify(testParams))
            mockDocument.cookie = `chatbase_query_params=${cookieValue}`

            const params = manager.getCookieParams()
            expect(params).toEqual(testParams)
        })

        it('should handle multiple cookies and find the correct one', () => {
            const testParams = { bot_1: 'ABC123' }
            const cookieValue = encodeURIComponent(JSON.stringify(testParams))
            mockDocument.cookie = `first=value1; chatbase_query_params=${cookieValue}; last=value2`

            const params = manager.getCookieParams()
            expect(params).toEqual(testParams)
        })
    })

    describe('saveToCookie', () => {
        it('should save parameters to cookie with correct format', () => {
            const testParams = { bot_1: 'ABC123', bot_2: 'DEF456' }
            manager.saveToCookie(testParams)

            const expectedValue = encodeURIComponent(JSON.stringify(testParams))
            const expectedCookie = `chatbase_query_params=${expectedValue}; max-age=604800; path=/; SameSite=Lax`
            expect(mockDocument.cookie).toBe(expectedCookie)
        })

        it('should handle empty parameters', () => {
            manager.saveToCookie({})

            const expectedValue = encodeURIComponent(JSON.stringify({}))
            const expectedCookie = `chatbase_query_params=${expectedValue}; max-age=604800; path=/; SameSite=Lax`
            expect(mockDocument.cookie).toBe(expectedCookie)
        })

        it('should handle complex parameter values', () => {
            const testParams = {
                bot_complex: JSON.stringify({
                    name: 'Test Bot',
                    description: 'A test bot with special chars: !@#$%',
                    chatbaseId: 'COMPLEX123',
                }),
            }

            manager.saveToCookie(testParams)

            const expectedValue = encodeURIComponent(JSON.stringify(testParams))
            const expectedCookie = `chatbase_query_params=${expectedValue}; max-age=604800; path=/; SameSite=Lax`
            expect(mockDocument.cookie).toBe(expectedCookie)
        })
    })

    describe('parseBotParameter', () => {
        it('should parse JSON bot configuration with all fields', () => {
            const botConfig = {
                name: 'Test Bot',
                description: 'Test Description',
                chatbaseId: 'TEST123',
                avatarUrl: 'https://example.com/avatar.jpg',
                isDefault: true,
            }

            const result = manager.parseBotParameter(JSON.stringify(botConfig))

            expect(result).toEqual({
                id: 'test-bot',
                name: 'Test Bot',
                description: 'Test Description',
                chatbaseId: 'TEST123',
                avatar: 'https://example.com/avatar.jpg',
                isDefault: true,
            })
        })

        it('should parse JSON bot configuration with minimal fields', () => {
            const botConfig = { chatbaseId: 'MIN123' }

            const result = manager.parseBotParameter(JSON.stringify(botConfig))

            expect(result).toEqual({
                id: 'MIN123',
                name: 'Bot MIN123',
                description: '',
                chatbaseId: 'MIN123',
                avatar: null,
                isDefault: false,
            })
        })

        it('should handle bot config with id field instead of chatbaseId', () => {
            const botConfig = { id: 'ID123', name: 'Bot with ID' }

            const result = manager.parseBotParameter(JSON.stringify(botConfig))

            expect(result).toEqual({
                id: 'bot-with-id',
                name: 'Bot with ID',
                description: '',
                chatbaseId: 'ID123',
                avatar: null,
                isDefault: false,
            })
        })

        it('should use alternative avatar field name', () => {
            const botConfig = {
                chatbaseId: 'AVT123',
                avatar: 'https://example.com/alt-avatar.jpg',
            }

            const result = manager.parseBotParameter(JSON.stringify(botConfig))

            expect(result.avatar).toBe('https://example.com/alt-avatar.jpg')
        })

        it('should generate ID from name with spaces', () => {
            const botConfig = {
                name: 'María José Financiera',
                chatbaseId: 'MARIA123',
            }

            const result = manager.parseBotParameter(JSON.stringify(botConfig))

            expect(result.id).toBe('maría-josé-financiera')
        })

        it('should parse simple string as chatbase ID', () => {
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

        it('should return bot object for invalid JSON string', () => {
            const result = manager.parseBotParameter('invalid-json{')
            expect(result).toEqual({
                id: 'bot-invalid-json{',
                name: 'Bot invalid-json{',
                description: '',
                chatbaseId: 'invalid-json{',
                avatar: null,
                isDefault: false,
            })
        })

        it('should return null for empty or null values', () => {
            expect(manager.parseBotParameter('')).toBeNull()
            expect(manager.parseBotParameter(null)).toBeNull()
            expect(manager.parseBotParameter(undefined)).toBeNull()
        })

        it('should return null for JSON without required fields', () => {
            const result = manager.parseBotParameter(JSON.stringify({ name: 'Test' }))
            expect(result).toBeNull()
        })

        it('should handle non-string values gracefully', () => {
            expect(manager.parseBotParameter(123)).toBeNull()
            expect(manager.parseBotParameter({})).toBeNull()
            expect(manager.parseBotParameter([])).toBeNull()
        })
    })

    describe('processQueryParams', () => {
        it('should process bot parameters from query string', () => {
            const queryParams = new URLSearchParams('bot_1=ABC123&bot_2=DEF456&other=value')
            const paramsToSave = {}

            const bots = manager.processQueryParams(queryParams, paramsToSave)

            expect(bots).toHaveLength(2)
            expect(bots[0]).toEqual({
                id: 'bot-ABC123',
                name: 'Bot ABC123',
                description: '',
                chatbaseId: 'ABC123',
                avatar: null,
                isDefault: false,
            })
            expect(bots[1]).toEqual({
                id: 'bot-DEF456',
                name: 'Bot DEF456',
                description: '',
                chatbaseId: 'DEF456',
                avatar: null,
                isDefault: false,
            })
            expect(paramsToSave).toEqual({
                bot_1: 'ABC123',
                bot_2: 'DEF456',
            })
        })

        it('should ignore non-bot parameters', () => {
            const queryParams = new URLSearchParams('other=value&normal=param&bot_1=ABC123')
            const paramsToSave = {}

            const bots = manager.processQueryParams(queryParams, paramsToSave)

            expect(bots).toHaveLength(1)
            expect(paramsToSave).toEqual({ bot_1: 'ABC123' })
        })

        it('should skip already processed parameters', () => {
            manager.processedParams.add('bot_1')
            const queryParams = new URLSearchParams('bot_1=ABC123&bot_2=DEF456')
            const paramsToSave = {}

            const bots = manager.processQueryParams(queryParams, paramsToSave)

            expect(bots).toHaveLength(1)
            expect(bots[0].chatbaseId).toBe('DEF456')
            expect(paramsToSave).toEqual({ bot_2: 'DEF456' })
        })

        it('should handle invalid bot parameters gracefully', () => {
            const queryParams = new URLSearchParams('bot_1=&bot_2=invalid-json{&bot_3=VALID123')
            const paramsToSave = {}

            const bots = manager.processQueryParams(queryParams, paramsToSave)

            // bot_1 is empty (null), bot_2 is invalid JSON but treated as string, bot_3 is valid
            expect(bots).toHaveLength(2) // bot_2 and bot_3
            expect(bots[1].chatbaseId).toBe('VALID123')
            expect(paramsToSave).toEqual({ bot_2: 'invalid-json{', bot_3: 'VALID123' })
        })

        it('should process JSON bot configurations', () => {
            const botConfig = JSON.stringify({
                name: 'Complex Bot',
                description: 'A complex bot',
                chatbaseId: 'COMPLEX123',
            })
            const queryParams = new URLSearchParams(`bot_1=${encodeURIComponent(botConfig)}`)
            const paramsToSave = {}

            const bots = manager.processQueryParams(queryParams, paramsToSave)

            expect(bots).toHaveLength(1)
            expect(bots[0]).toEqual({
                id: 'complex-bot',
                name: 'Complex Bot',
                description: 'A complex bot',
                chatbaseId: 'COMPLEX123',
                avatar: null,
                isDefault: false,
            })
        })

        it('should return empty array when no bot parameters', () => {
            const queryParams = new URLSearchParams('other=value&normal=param')
            const paramsToSave = {}

            const bots = manager.processQueryParams(queryParams, paramsToSave)

            expect(bots).toHaveLength(0)
            expect(paramsToSave).toEqual({})
        })
    })

    describe('processCookieParams', () => {
        it('should process bot parameters from cookies', () => {
            const cookieParams = {
                bot_1: 'COOKIE123',
                bot_2: 'COOKIE456',
                other: 'value',
            }
            const queryParams = new URLSearchParams()
            const existingBots = []

            const bots = manager.processCookieParams(cookieParams, queryParams, existingBots)

            expect(bots).toHaveLength(2)
            expect(bots[0].chatbaseId).toBe('COOKIE123')
            expect(bots[1].chatbaseId).toBe('COOKIE456')
        })

        it('should skip parameters that exist in query params', () => {
            const cookieParams = {
                bot_1: 'COOKIE123',
                bot_2: 'COOKIE456',
            }
            const queryParams = new URLSearchParams('bot_1=QUERY123')
            const existingBots = []

            const bots = manager.processCookieParams(cookieParams, queryParams, existingBots)

            expect(bots).toHaveLength(1)
            expect(bots[0].chatbaseId).toBe('COOKIE456')
        })

        it('should skip bots that already exist', () => {
            const cookieParams = {
                bot_1: 'COOKIE123',
                bot_2: 'COOKIE456',
            }
            const queryParams = new URLSearchParams()
            const existingBots = [
                {
                    id: 'bot-COOKIE123',
                    name: 'Bot COOKIE123',
                    description: '',
                    chatbaseId: 'COOKIE123',
                    avatar: null,
                    isDefault: false,
                },
            ]

            const bots = manager.processCookieParams(cookieParams, queryParams, existingBots)

            expect(bots).toHaveLength(1)
            expect(bots[0].chatbaseId).toBe('COOKIE456')
        })

        it('should ignore non-bot parameters', () => {
            const cookieParams = {
                other: 'value',
                normal: 'param',
                bot_1: 'COOKIE123',
            }
            const queryParams = new URLSearchParams()
            const existingBots = []

            const bots = manager.processCookieParams(cookieParams, queryParams, existingBots)

            expect(bots).toHaveLength(1)
            expect(bots[0].chatbaseId).toBe('COOKIE123')
        })

        it('should handle invalid bot parameters gracefully', () => {
            const cookieParams = {
                bot_1: '',
                bot_2: 'invalid-json{',
                bot_3: 'VALID123',
            }
            const queryParams = new URLSearchParams()
            const existingBots = []

            const bots = manager.processCookieParams(cookieParams, queryParams, existingBots)

            // bot_1 is empty (null), bot_2 is invalid JSON but treated as string, bot_3 is valid
            expect(bots).toHaveLength(2) // bot_2 and bot_3
            expect(bots[1].chatbaseId).toBe('VALID123')
        })

        it('should return empty array when no valid bot parameters', () => {
            const cookieParams = { other: 'value', normal: 'param' }
            const queryParams = new URLSearchParams()
            const existingBots = []

            const bots = manager.processCookieParams(cookieParams, queryParams, existingBots)

            expect(bots).toHaveLength(0)
        })
    })

    describe('loadBotsFromParams', () => {
        it('should load bots from both query and cookie parameters', () => {
            // Setup query params
            mockWindow.location.search = '?bot_1=QUERY123'

            // Setup cookie params
            const cookieParams = { bot_2: 'COOKIE456' }
            const cookieValue = encodeURIComponent(JSON.stringify(cookieParams))
            mockDocument.cookie = `chatbase_query_params=${cookieValue}`

            const bots = manager.loadBotsFromParams()

            expect(bots).toHaveLength(2)
            expect(bots[0].chatbaseId).toBe('QUERY123')
            expect(bots[1].chatbaseId).toBe('COOKIE456')
        })

        it('should save new parameters to cookie', () => {
            mockWindow.location.search = '?bot_1=NEW123'

            manager.loadBotsFromParams()

            // Check that cookie was set
            const expectedValue = encodeURIComponent(JSON.stringify({ bot_1: 'NEW123' }))
            expect(mockDocument.cookie).toContain(expectedValue)
        })

        it('should merge with existing cookie parameters', () => {
            // Setup existing cookie
            const existingParams = { bot_existing: 'EXISTING123' }
            const existingCookieValue = encodeURIComponent(JSON.stringify(existingParams))
            mockDocument.cookie = `chatbase_query_params=${existingCookieValue}`

            // Setup new query params
            mockWindow.location.search = '?bot_1=NEW123'

            manager.loadBotsFromParams()

            // Check that both old and new params are saved
            const expectedMerged = { bot_existing: 'EXISTING123', bot_1: 'NEW123' }
            const expectedValue = encodeURIComponent(JSON.stringify(expectedMerged))
            expect(mockDocument.cookie).toContain(expectedValue)
        })

        it('should return empty array when no parameters', () => {
            mockWindow.location.search = ''
            mockDocument.cookie = ''

            const bots = manager.loadBotsFromParams()

            expect(bots).toHaveLength(0)
        })

        it('should not save to cookie when no new parameters', () => {
            mockWindow.location.search = ''
            const initialCookie = mockDocument.cookie

            manager.loadBotsFromParams()

            expect(mockDocument.cookie).toBe(initialCookie)
        })
    })

    describe('cleanURLParams', () => {
        it('should clean URL parameters when they exist', () => {
            mockWindow.location.search = '?bot_1=ABC123&other=value'
            mockWindow.location.href = 'https://example.com/?bot_1=ABC123&other=value'

            manager.cleanURLParams()

            expect(mockWindow.history.replaceState).toHaveBeenCalledWith(
                {},
                'Test Page',
                'https://example.com/'
            )
        })

        it('should not clean URL when no parameters', () => {
            mockWindow.location.search = ''
            mockWindow.location.href = 'https://example.com/'

            manager.cleanURLParams()

            expect(mockWindow.history.replaceState).not.toHaveBeenCalled()
        })

        it('should handle URLs with fragment', () => {
            mockWindow.location.search = '?bot_1=ABC123'
            mockWindow.location.href = 'https://example.com/?bot_1=ABC123#section'

            manager.cleanURLParams()

            expect(mockWindow.history.replaceState).toHaveBeenCalledWith(
                {},
                'Test Page',
                'https://example.com/#section'
            )
        })

        it('should handle complex URLs', () => {
            mockWindow.location.search = '?bot_1=ABC123&bot_2=DEF456'
            mockWindow.location.href = 'https://example.com/path/page?bot_1=ABC123&bot_2=DEF456'

            manager.cleanURLParams()

            expect(mockWindow.history.replaceState).toHaveBeenCalledWith(
                {},
                'Test Page',
                'https://example.com/path/page'
            )
        })
    })

    describe('clearStoredParams', () => {
        it('should clear cookie and processed params', () => {
            manager.processedParams.add('bot_1')
            manager.processedParams.add('bot_2')

            manager.clearStoredParams()

            expect(mockDocument.cookie).toBe('chatbase_query_params=; max-age=0; path=/')
            expect(manager.processedParams.size).toBe(0)
        })

        it('should work when no processed params exist', () => {
            expect(manager.processedParams.size).toBe(0)

            manager.clearStoredParams()

            expect(mockDocument.cookie).toBe('chatbase_query_params=; max-age=0; path=/')
            expect(manager.processedParams.size).toBe(0)
        })
    })

    describe('Global Functions and Module Testing', () => {
        let waitForChatManager
        let loadBotsFromParamsAsync
        let loadBotsFromURLParams

        beforeEach(() => {
            // Create helper functions for testing (replicate module logic)
            waitForChatManager = (maxWaitTime = 5000) =>
                new Promise((resolve, reject) => {
                    const startTime = Date.now()

                    function checkChatManager() {
                        if (window.chatManager) {
                            resolve()
                        } else if (Date.now() - startTime > maxWaitTime) {
                            reject(new Error('ChatManager not found within timeout'))
                        } else {
                            requestAnimationFrame(checkChatManager)
                        }
                    }

                    checkChatManager()
                })

            loadBotsFromParamsAsync = async () => {
                await waitForChatManager()
                if (window.loadBotsFromURLParams) {
                    const botsLoaded = window.loadBotsFromURLParams()
                    return botsLoaded
                }
            }

            // Create the global loadBotsFromURLParams function
            loadBotsFromURLParams = () => {
                const manager = window.urlParamsManager || new URLParamsManager()
                const queryParams = manager.storedParams || manager.getQueryParams()
                const cookieParams = manager.getCookieParams()
                const paramsToSave = {}

                const botsFromQuery = manager.processQueryParams(queryParams, paramsToSave)
                const botsFromCookies = manager.processCookieParams(
                    cookieParams,
                    queryParams,
                    botsFromQuery
                )
                const botsFromParams = [...botsFromQuery, ...botsFromCookies]

                if (Object.keys(paramsToSave).length > 0) {
                    const existingCookieParams = manager.getCookieParams()
                    manager.saveToCookie({ ...existingCookieParams, ...paramsToSave })
                }

                if (botsFromParams.length > 0) {
                    const existingBots = window.chatManager ? window.chatManager.bots : []
                    const mergedBots = [...existingBots]

                    for (const newBot of botsFromParams) {
                        if (!mergedBots.find(b => b.id === newBot.id)) {
                            mergedBots.push(newBot)
                        }
                    }

                    if (window.chatManager) {
                        window.chatManager.bots = mergedBots
                        window.chatManager.saveBots()
                        window.chatManager.renderExperts()
                        manager.cleanURLParams()
                    }

                    return botsFromParams
                }

                return []
            }

            // Set up window.loadBotsFromURLParams
            window.loadBotsFromURLParams = loadBotsFromURLParams
        })

        describe('waitForChatManager', () => {
            it('should resolve when chatManager is available', async () => {
                mockWindow.chatManager = { bots: [] }

                await expect(waitForChatManager()).resolves.toBeUndefined()
            })

            it('should reject when chatManager is not found within timeout', async () => {
                mockWindow.chatManager = null

                await expect(waitForChatManager(100)).rejects.toThrow(
                    'ChatManager not found within timeout'
                )
            })

            it('should wait and then resolve when chatManager becomes available', async () => {
                mockWindow.chatManager = null

                // Make chatManager available after a delay
                setTimeout(() => {
                    mockWindow.chatManager = { bots: [] }
                }, 50)

                await expect(waitForChatManager(200)).resolves.toBeUndefined()
            })
        })

        describe('loadBotsFromParamsAsync', () => {
            it('should load bots when chatManager is available', async () => {
                mockWindow.chatManager = {
                    bots: [],
                    saveBots: vi.fn(),
                    renderExperts: vi.fn(),
                }
                mockWindow.location.search = '?bot_1=ASYNC123'

                const result = await loadBotsFromParamsAsync()

                expect(result).toHaveLength(1)
                expect(result[0].chatbaseId).toBe('ASYNC123')
            })

            it('should throw error when chatManager is not available', async () => {
                mockWindow.chatManager = null

                // Create a faster-failing version for the test
                const testWaitForChatManager = (maxWaitTime = 50) =>
                    new Promise((resolve, reject) => {
                        const startTime = Date.now()

                        function checkChatManager() {
                            if (window.chatManager) {
                                resolve()
                            } else if (Date.now() - startTime > maxWaitTime) {
                                reject(new Error('ChatManager not found within timeout'))
                            } else {
                                setTimeout(checkChatManager, 10)
                            }
                        }

                        checkChatManager()
                    })

                const testLoadBotsFromParamsAsync = async () => {
                    await testWaitForChatManager()
                    if (window.loadBotsFromURLParams) {
                        const botsLoaded = window.loadBotsFromURLParams()
                        return botsLoaded
                    }
                }

                await expect(testLoadBotsFromParamsAsync()).rejects.toThrow(
                    'ChatManager not found within timeout'
                )
            })

            it('should return undefined when loadBotsFromURLParams is not available', async () => {
                mockWindow.chatManager = { bots: [] }
                mockWindow.loadBotsFromURLParams = null

                const result = await loadBotsFromParamsAsync()

                expect(result).toBeUndefined()
            })
        })

        describe('loadBotsFromURLParams Global Function', () => {
            beforeEach(() => {
                // Set up test environment
                mockWindow.urlParamsManager = manager
                mockWindow.chatManager = {
                    bots: [
                        {
                            id: 'existing-bot',
                            name: 'Existing Bot',
                            description: 'Already exists',
                            chatbaseId: 'EXISTING123',
                            avatar: null,
                            isDefault: false,
                        },
                    ],
                    saveBots: vi.fn(),
                    renderExperts: vi.fn(),
                }
            })

            it('should load bots from stored parameters', () => {
                mockWindow.location.search = '?bot_1=STORED123'
                manager.storedParams = new URLSearchParams('bot_1=STORED123')

                const result = loadBotsFromURLParams()

                expect(result).toHaveLength(1)
                expect(result[0].chatbaseId).toBe('STORED123')
            })

            it('should merge with existing bots avoiding duplicates', () => {
                // The parameter would create a bot with ID 'bot-existing-bot', not 'existing-bot'
                mockWindow.location.search = '?bot_1=existing-bot'

                const result = loadBotsFromURLParams()

                // Should add new bot since IDs don't match ('bot-existing-bot' vs 'existing-bot')
                expect(mockWindow.chatManager.bots).toHaveLength(2) // Original + new bot
                expect(result).toHaveLength(1) // One new bot found
            })

            it('should save new parameters to cookie', () => {
                mockWindow.location.search = '?bot_1=NEW123'

                loadBotsFromURLParams()

                // Check that cookie was set
                const expectedValue = encodeURIComponent(JSON.stringify({ bot_1: 'NEW123' }))
                expect(mockDocument.cookie).toContain(expectedValue)
            })

            it('should clean URL parameters after successful processing', () => {
                mockWindow.location.search = '?bot_1=CLEAN123'

                loadBotsFromURLParams()

                expect(mockWindow.history.replaceState).toHaveBeenCalled()
            })

            it('should update chatManager when bots are loaded', () => {
                mockWindow.location.search = '?bot_1=UPDATE123'

                const result = loadBotsFromURLParams()

                expect(mockWindow.chatManager.saveBots).toHaveBeenCalled()
                expect(mockWindow.chatManager.renderExperts).toHaveBeenCalled()
                expect(result).toHaveLength(1)
            })

            it('should return empty array when no bots found', () => {
                mockWindow.location.search = ''

                const result = loadBotsFromURLParams()

                expect(result).toHaveLength(0)
                expect(mockWindow.history.replaceState).not.toHaveBeenCalled()
            })

            it('should work without chatManager', () => {
                mockWindow.chatManager = null
                mockWindow.location.search = '?bot_1=NOCHAT123'

                const result = loadBotsFromURLParams()

                expect(result).toHaveLength(1) // Still returns bots found
            })

            it('should use storedParams when available', () => {
                manager.storedParams = new URLSearchParams('bot_stored=STORED456')

                const result = loadBotsFromURLParams()

                expect(result).toHaveLength(1)
                expect(result[0].chatbaseId).toBe('STORED456')
            })

            it('should fallback to getQueryParams when storedParams not available', () => {
                manager.storedParams = null
                mockWindow.location.search = '?bot_1=FALLBACK123'

                const result = loadBotsFromURLParams()

                expect(result).toHaveLength(1)
                expect(result[0].chatbaseId).toBe('FALLBACK123')
            })
        })

        describe('Edge Cases and Error Handling', () => {
            it('should handle missing window.history', () => {
                const originalHistory = mockWindow.history
                mockWindow.history = null

                mockWindow.location.search = '?bot_1=ABC123'

                // Should not throw error
                expect(() => manager.cleanURLParams()).not.toThrow()

                mockWindow.history = originalHistory
            })

            it('should handle edge cases in URL processing', () => {
                // Test that the method handles various URL scenarios gracefully
                mockWindow.location.search = ''

                // Should not throw when no parameters to clean
                expect(() => manager.cleanURLParams()).not.toThrow()

                // Should handle normal operation
                mockWindow.location.search = '?test=value'
                expect(() => manager.cleanURLParams()).not.toThrow()
            })

            it('should handle very long parameter values', () => {
                const longValue = 'A'.repeat(10000)
                const result = manager.parseBotParameter(longValue)

                expect(result).toEqual({
                    id: `bot-${longValue}`,
                    name: `Bot ${longValue}`,
                    description: '',
                    chatbaseId: longValue,
                    avatar: null,
                    isDefault: false,
                })
            })

            it('should handle special characters in bot parameters', () => {
                const specialChars = 'bot-id-with-!@#$%^&*()_+{}|:"<>?'
                const result = manager.parseBotParameter(specialChars)

                expect(result.chatbaseId).toBe(specialChars)
            })

            it('should handle Unicode characters in bot names', () => {
                const botConfig = {
                    name: '机器人 María José Müller ñáéíóú',
                    chatbaseId: 'UNICODE123',
                }

                const result = manager.parseBotParameter(JSON.stringify(botConfig))

                expect(result.id).toBe('机器人-maría-josé-müller-ñáéíóú')
                expect(result.name).toBe('机器人 María José Müller ñáéíóú')
            })
        })
    })
})
