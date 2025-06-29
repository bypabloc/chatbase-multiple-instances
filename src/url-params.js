/**
 * URL Query Parameter Handler
 * Manages loading bots from URL parameters and cookie storage
 */
import logger from './logger.js'

class URLParamsManager {
    constructor() {
        this.cookieName = 'chatbase_query_params'
        this.botParamPrefix = 'bot_'
        this.processedParams = new Set()
    }

    /**
     * Get all query parameters from the current URL
     * @returns {URLSearchParams} URL search parameters
     */
    getQueryParams() {
        return new URLSearchParams(window.location.search)
    }

    /**
     * Get query parameters stored in cookies
     * @returns {Object} Stored query parameters
     */
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

    /**
     * Save query parameters to cookies
     * @param {Object} params Parameters to save
     */
    saveToCookie(params) {
        const maxAge = 60 * 60 * 24 * 7 // 7 days
        document.cookie = `${this.cookieName}=${encodeURIComponent(JSON.stringify(params))}; max-age=${maxAge}; path=/; SameSite=Lax`
    }

    /**
     * Extract bot configuration from parameter value
     * @param {string} value Parameter value (JSON string or bot ID)
     * @returns {Object|null} Bot configuration object
     */
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

    /**
     * Process URL query parameters
     * @param {URLSearchParams} queryParams Query parameters
     * @param {Object} paramsToSave Parameters to save
     * @returns {Array} Array of bot configurations
     */
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

    /**
     * Process cookie parameters
     * @param {Object} cookieParams Cookie parameters
     * @param {URLSearchParams} queryParams Query parameters
     * @param {Array} existingBots Already processed bots
     * @returns {Array} Array of bot configurations
     */
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

    /**
     * Load bots from query parameters
     * @returns {Array} Array of bot configurations
     */
    loadBotsFromParams() {
        const queryParams = this.getQueryParams()
        const cookieParams = this.getCookieParams()
        const paramsToSave = {}

        logger.log('URL Params Manager - Query params:', Array.from(queryParams.entries()))
        logger.log('URL Params Manager - Cookie params:', cookieParams)

        // Process URL parameters
        const botsFromQuery = this.processQueryParams(queryParams, paramsToSave)
        logger.log('URL Params Manager - Bots from query:', botsFromQuery)

        // Process cookie parameters
        const botsFromCookies = this.processCookieParams(cookieParams, queryParams, botsFromQuery)
        logger.log('URL Params Manager - Bots from cookies:', botsFromCookies)

        // Combine all bots
        const allBots = [...botsFromQuery, ...botsFromCookies]

        // Save new parameters to cookie
        if (Object.keys(paramsToSave).length > 0) {
            const existingCookieParams = this.getCookieParams()
            this.saveToCookie({ ...existingCookieParams, ...paramsToSave })
        }

        return allBots
    }

    /**
     * Clean URL parameters after processing
     */
    cleanURLParams() {
        const queryParams = this.getQueryParams()
        if (queryParams.toString()) {
            const url = new URL(window.location.href)
            url.search = ''
            window.history.replaceState({}, document.title, url.toString())
        }
    }

    /**
     * Clear all stored parameters from cookies
     */
    clearStoredParams() {
        document.cookie = `${this.cookieName}=; max-age=0; path=/`
        this.processedParams.clear()
    }
}

// Create global instance
window.urlParamsManager = new URLParamsManager()

// Store URL parameters immediately when script loads (before they get cleared)
window.urlParamsManager.storedParams = window.urlParamsManager.getQueryParams()

logger.log(
    'URL Params Manager - Script loaded, stored params:',
    Array.from(window.urlParamsManager.storedParams.entries())
)

// Function to wait for chatManager to be ready
const waitForChatManager = (maxWaitTime = 5000) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now()

        const checkChatManager = () => {
            if (window.chatManager) {
                logger.log('URL Params Manager - ChatManager found')
                resolve()
            } else if (Date.now() - startTime > maxWaitTime) {
                logger.warn('URL Params Manager - Timeout waiting for chatManager')
                reject(new Error('ChatManager not found within timeout'))
            } else {
                // Use requestAnimationFrame for better performance
                requestAnimationFrame(checkChatManager)
            }
        }

        checkChatManager()
    })
}

// Function to load bots from parameters
const loadBotsFromParamsAsync = async () => {
    try {
        logger.log('URL Params Manager - Waiting for chatManager...')
        await waitForChatManager()

        logger.log('URL Params Manager - Loading bots from URL params')
        if (window.loadBotsFromURLParams) {
            const botsLoaded = window.loadBotsFromURLParams()
            if (botsLoaded.length > 0) {
                logger.log(
                    `URL Params Manager - Loaded ${botsLoaded.length} bots from URL parameters`
                )
            }
        }
    } catch (error) {
        logger.error('URL Params Manager - Error loading bots:', error)
    }
}

// Try to load bots when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    logger.log('URL Params Manager - DOM ready, attempting to load bots')
    loadBotsFromParamsAsync()
})

// Function to load bots from URL parameters (to be called from main script)
window.loadBotsFromURLParams = () => {
    const manager = window.urlParamsManager

    // Use stored params instead of current URL params
    const queryParams = manager.storedParams || manager.getQueryParams()
    const cookieParams = manager.getCookieParams()
    const paramsToSave = {}

    logger.log('URL Params Manager - Using stored params:', Array.from(queryParams.entries()))
    logger.log('URL Params Manager - Cookie params:', cookieParams)

    // Process URL parameters
    const botsFromQuery = manager.processQueryParams(queryParams, paramsToSave)
    logger.log('URL Params Manager - Bots from query:', botsFromQuery)

    // Process cookie parameters
    const botsFromCookies = manager.processCookieParams(cookieParams, queryParams, botsFromQuery)
    logger.log('URL Params Manager - Bots from cookies:', botsFromCookies)

    // Combine all bots
    const botsFromParams = [...botsFromQuery, ...botsFromCookies]

    // Save new parameters to cookie
    if (Object.keys(paramsToSave).length > 0) {
        const existingCookieParams = manager.getCookieParams()
        manager.saveToCookie({ ...existingCookieParams, ...paramsToSave })
    }

    logger.log('URL Params Manager - Loaded bots:', botsFromParams)

    if (botsFromParams.length > 0) {
        // Get existing bots from chatManager
        const existingBots = window.chatManager ? window.chatManager.bots : []
        logger.log('URL Params Manager - Existing bots:', existingBots)

        // Merge with existing bots (avoid duplicates)
        const mergedBots = [...existingBots]
        for (const newBot of botsFromParams) {
            if (!mergedBots.find(b => b.id === newBot.id)) {
                mergedBots.push(newBot)
            }
        }

        logger.log('URL Params Manager - Merged bots:', mergedBots)

        // Update chatManager bots and save
        if (window.chatManager) {
            window.chatManager.bots = mergedBots
            window.chatManager.saveBots()
            window.chatManager.renderExperts()

            // Clean URL parameters after successful processing
            manager.cleanURLParams()
        }

        return botsFromParams
    }

    return []
}
