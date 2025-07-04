// @unocss-include
import { inject } from '@vercel/analytics'
import 'uno.css'
import logger from './logger.js'

// Only inject Vercel Analytics in production
if (import.meta.env.PROD) {
    inject()
}

/**
 * Configuration constants for the application
 */
const CONFIG = {
    IFRAME_MODE: true,
    MOBILE_BREAKPOINT: 768,
    STORAGE_KEY: 'chatbaseBots',
    TRANSITION_DELAY: 100,
    CHAT_BASE_URL: 'https://www.chatbase.co',
}

/**
 * CSS styles for chat components
 */
const STYLES = {
    CHAT_CONTAINER_MOBILE: `
        position: fixed;
        top: 0;
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100vh;
        max-width: 100vw;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        background: transparent;
        pointer-events: none;
    `,
    CHAT_CONTAINER_DESKTOP: `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        height: 650px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    `,
    IFRAME_CONTAINER: `
        width: 100%;
        height: calc(100% - 60px);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        background: white;
    `,
    IFRAME_CONTAINER_MOBILE: `
        width: 100%;
        height: calc(100% - 60px);
        border-radius: 0;
        overflow: hidden;
        box-shadow: none;
        background: white;
        pointer-events: auto;
    `,
    CLOSE_BUTTON: `
        margin-top: 10px;
        background: #2563eb;
        color: white;
        border: none;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 10;
        padding: 0;
        pointer-events: auto;
    `,
    IFRAME: `
        width: 100%;
        height: 100%;
        border: none;
    `,
}

/**
 * Helper functions for ID generation and element creation
 */

/**
 * Generate a unique ID for an element
 * @param {string} prefix - Prefix for the ID
 * @param {string} suffix - Suffix for the ID (optional)
 * @returns {string} Unique ID
 */
const generateId = (prefix, suffix = '') => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 11)
    return suffix ? `${prefix}-${suffix}-${random}` : `${prefix}-${timestamp}-${random}`
}

/**
 * Create element with ID and classes
 * @param {string} tag - HTML tag name
 * @param {string} id - Element ID
 * @param {string} className - CSS classes
 * @returns {HTMLElement} Created element
 */
const createElement = (tag, id, className = '') => {
    const element = document.createElement(tag)
    element.id = id
    if (className) element.className = className
    return element
}

/**
 * Create icon element
 * @param {string} iconClass - Icon class (e.g., 'i-heroicons-star')
 * @param {string} id - Element ID
 * @param {string} size - Size classes (e.g., 'w-4 h-4')
 * @returns {HTMLElement} Icon element
 */
const createIcon = (iconClass, id, size = 'w-4 h-4') => {
    const icon = document.createElement('div')
    icon.id = id
    icon.className = `${iconClass} ${size}`
    return icon
}

// Export helper functions as an object for backward compatibility
const ElementHelper = {
    generateId,
    createElement,
    createIcon,
}

/**
 * Validation helper functions for form and data validation
 */

/**
 * Check if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
const isValidUrl = url => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

/**
 * Validate bot form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validateBotForm = formData => {
    const errors = []

    if (!formData.name?.trim()) {
        errors.push('El nombre es requerido')
    }

    if (!formData.description?.trim()) {
        errors.push('La descripción es requerida')
    }

    if (!formData.chatbaseId?.trim()) {
        errors.push('El ID de Chatbase es requerido')
    }

    if (formData.avatar && !isValidUrl(formData.avatar)) {
        errors.push('La URL del avatar no es válida')
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

/**
 * Validate imported bot data
 * @param {Array} importedData - Data to validate
 * @returns {Object} Validation result
 */
const validateImportData = importedData => {
    if (!Array.isArray(importedData)) {
        return {
            isValid: false,
            error: 'El archivo JSON debe contener un array de bots',
        }
    }

    const requiredFields = ['id', 'name', 'description', 'chatbaseId', 'avatar', 'isDefault']

    for (const bot of importedData) {
        if (!bot || typeof bot !== 'object') {
            return {
                isValid: false,
                error: 'Cada elemento debe ser un objeto válido',
            }
        }

        for (const field of requiredFields) {
            if (!(field in bot)) {
                return {
                    isValid: false,
                    error: `El campo '${field}' es requerido en todos los bots`,
                }
            }
        }

        if (typeof bot.isDefault !== 'boolean') {
            return {
                isValid: false,
                error: 'El campo isDefault debe ser true o false',
            }
        }
    }

    return { isValid: true }
}

/**
 * Validate file for import
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
const validateImportFile = file => {
    if (!file) {
        return {
            isValid: false,
            error: 'Por favor selecciona un archivo JSON',
        }
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
        return {
            isValid: false,
            error: 'El archivo debe ser de tipo JSON',
        }
    }

    return { isValid: true }
}

// Export validation functions as an object for backward compatibility
const ValidationHelper = {
    validateBotForm,
    validateImportData,
    isValidUrl,
    validateImportFile,
}

/**
 * Main ChatbaseManager class handles all chat functionality
 */
class ChatbaseManager {
    constructor() {
        this.bots = []
        this.chatInstances = {}
        this.currentBotId = null
        this.lastMinimizedBotId = null
        this.isTransitioning = false
        this.currentTheme = 'system'
        this.elementHelper = ElementHelper
        this.init()
    }

    /**
     * Initialize the manager and load saved bots
     */
    init() {
        this.loadBots()
        this.setupEventListeners()
        this.initTheme()
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        window.addEventListener('beforeunload', () => this.cleanupAllInstances())
        window.onclick = event => this.handleModalClick(event)
        window.addEventListener('resize', () => this.handleResize())
    }

    /**
     * Handle modal outside click
     * @param {Event} event - Click event
     */
    handleModalClick(event) {
        const modal = document.getElementById('configModal')
        if (event.target === modal) {
            this.closeConfig()
        }
    }

    /**
     * Handle window resize - update chat instances for mobile/desktop changes
     */
    handleResize() {
        // Throttle resize events
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout)
        }

        this.resizeTimeout = setTimeout(() => {
            this.updateChatInstancesForResize()

            // Handle carousel for mobile/desktop switch
            const isMobile = this.isMobile()
            const carouselControls = document.getElementById('carouselControls')

            if (isMobile && this.bots.length > 0) {
                // Initialize carousel for mobile
                this.initializeCarousel()
                if (carouselControls) {
                    carouselControls.style.display = 'flex'
                }
            } else {
                // Hide carousel controls on desktop
                if (carouselControls) {
                    carouselControls.style.display = 'none'
                }
            }
        }, 100)
    }

    /**
     * Update all active chat instances when screen size changes
     */
    updateChatInstancesForResize() {
        const isMobile = this.isMobile()
        let hasVisibleInstance = false

        // Process each chat instance
        for (const botId of Object.keys(this.chatInstances)) {
            const instance = this.chatInstances[botId]
            if (instance?.container) {
                hasVisibleInstance =
                    this.updateSingleInstance(instance, botId, isMobile) || hasVisibleInstance
            }
        }

        // Update mobile scroll based on visible instances
        this.updateMobileScroll(hasVisibleInstance)
    }

    /**
     * Update a single chat instance for resize
     * @param {Object} instance - Chat instance to update
     * @param {string} botId - Bot ID
     * @param {boolean} isMobile - Whether in mobile view
     * @returns {boolean} Whether instance is visible
     */
    updateSingleInstance(instance, botId, isMobile) {
        const wasVisible = instance.isVisible

        // Update container styles
        this.updateContainerStyles(instance.container, isMobile, wasVisible)

        // Update iframe container if exists
        this.updateIframeContainer(instance.container, botId, isMobile)

        return instance.isVisible
    }

    /**
     * Update container styles based on device type
     * @param {HTMLElement} container - Container element
     * @param {boolean} isMobile - Whether in mobile view
     * @param {boolean} wasVisible - Previous visibility state
     */
    updateContainerStyles(container, isMobile, wasVisible) {
        const containerStyles = isMobile
            ? STYLES.CHAT_CONTAINER_MOBILE
            : STYLES.CHAT_CONTAINER_DESKTOP

        container.style.cssText = containerStyles

        // Preserve hidden state
        if (!wasVisible) {
            container.style.display = 'none'
        }
    }

    /**
     * Update iframe container styles
     * @param {HTMLElement} container - Parent container
     * @param {string} botId - Bot ID
     * @param {boolean} isMobile - Whether in mobile view
     */
    updateIframeContainer(container, botId, isMobile) {
        const iframeContainer = container.querySelector(`#chatbase-iframe-container-${botId}`)
        if (iframeContainer) {
            iframeContainer.style.cssText = isMobile
                ? STYLES.IFRAME_CONTAINER_MOBILE
                : STYLES.IFRAME_CONTAINER
        }
    }

    /**
     * Update mobile scroll based on visible instances
     * @param {boolean} hasVisibleInstance - Whether any instance is visible
     */
    updateMobileScroll(hasVisibleInstance) {
        if (hasVisibleInstance) {
            this.disableMobileScroll()
        } else {
            this.enableMobileScroll()
        }
    }

    /**
     * Load bots from localStorage
     */
    loadBots() {
        try {
            const savedBots = localStorage.getItem(CONFIG.STORAGE_KEY)
            this.bots = savedBots ? JSON.parse(savedBots) : []
            this.renderExperts()
            this.updateFloatingChatButton()
            this.updateButtonStates()

            // Initialize carousel if on mobile after loading bots
            if (this.isMobile() && this.bots.length > 0) {
                // Small delay to ensure DOM is ready
                setTimeout(() => this.initializeCarousel(), 100)
            }
        } catch (error) {
            logger.error('Error loading bots:', error)
            this.bots = []
            this.renderExperts()
            this.updateFloatingChatButton()
            this.updateButtonStates()
        }
    }

    /**
     * Save bots to localStorage
     */
    saveBots() {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.bots))
    }

    /**
     * Get the default bot
     * @returns {Object|null} Default bot or first bot if none set as default
     */
    getDefaultBot() {
        if (!this.bots || this.bots.length === 0) return null
        return this.bots.find(bot => bot.isDefault) || this.bots[0]
    }

    /**
     * Set a bot as default
     * @param {string} botId - Bot ID to set as default
     */
    setDefaultBot(botId) {
        this.bots.forEach(bot => {
            bot.isDefault = bot.id === botId
        })
        this.saveBots()
        this.updateFloatingChatButton()
        this.renderBotList() // Re-renderizar la lista para mostrar el cambio visual inmediatamente
    }

    /**
     * Generate initials from name
     * @param {string} name - Full name
     * @returns {string} First letters of each word, max 2 chars
     */
    getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .slice(0, 2)
    }

    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    isMobile() {
        return window.innerWidth <= CONFIG.MOBILE_BREAKPOINT
    }

    /**
     * Disable mobile scroll when chat is open
     */
    disableMobileScroll() {
        if (this.isMobile()) {
            document.body.style.overflow = 'hidden'
            document.body.style.position = 'fixed'
            document.body.style.width = '100%'
            document.body.style.top = '0'
        }
    }

    /**
     * Enable mobile scroll when chat is closed
     */
    enableMobileScroll() {
        if (this.isMobile()) {
            document.body.style.overflow = ''
            document.body.style.position = ''
            document.body.style.width = ''
            document.body.style.top = ''
        }
    }

    /**
     * Initialize theme system
     */
    initTheme() {
        // Load saved theme preference
        this.currentTheme = localStorage.getItem('theme') || 'system'

        // Apply theme
        this.applyTheme(this.currentTheme)

        // Setup theme switch event listeners
        this.setupThemeSwitch()

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.currentTheme === 'system') {
                this.applyTheme('system')
            }
        })
    }

    /**
     * Setup theme switch event listeners
     */
    setupThemeSwitch() {
        const themeSwitch = document.getElementById('themeSwitch')
        if (!themeSwitch) return

        themeSwitch.addEventListener('click', e => {
            const button = e.target.closest('[data-theme]')
            if (!button) return

            const theme = button.dataset.theme
            this.setTheme(theme)
        })

        // Update UI to reflect current theme
        this.updateThemeSwitchUI()
    }

    /**
     * Set theme and save preference
     * @param {string} theme - Theme name: 'light', 'dark', or 'system'
     */
    setTheme(theme) {
        this.currentTheme = theme
        localStorage.setItem('theme', theme)
        this.applyTheme(theme)
        this.updateThemeSwitchUI()
    }

    /**
     * Apply theme to document
     * @param {string} theme - Theme name: 'light', 'dark', or 'system'
     */
    applyTheme(theme) {
        const html = document.documentElement

        // Remove existing theme classes
        html.classList.remove('light', 'dark')

        if (theme === 'system') {
            // Use system preference
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            html.classList.add(systemPrefersDark ? 'dark' : 'light')
        } else {
            // Use explicit theme
            html.classList.add(theme)
        }
    }

    /**
     * Update theme switch UI to reflect current selection
     */
    updateThemeSwitchUI() {
        const themeSwitch = document.getElementById('themeSwitch')
        if (!themeSwitch) return

        // Remove active state from all buttons
        themeSwitch.querySelectorAll('[data-theme]').forEach(btn => {
            btn.classList.remove('bg-white', 'text-slate-900', 'shadow-sm')
            btn.classList.add('text-slate-600', 'hover:text-slate-900')
        })

        // Add active state to current theme
        const activeButton = themeSwitch.querySelector(`[data-theme="${this.currentTheme}"]`)
        if (activeButton) {
            activeButton.classList.add('bg-white', 'text-slate-900', 'shadow-sm')
            activeButton.classList.remove('text-slate-600', 'hover:text-slate-900')
        }
    }

    /**
     * Render expert cards in the grid
     */
    renderExperts() {
        const grid = document.getElementById('expertsGrid')
        grid.innerHTML = ''

        this.bots.forEach(bot => {
            const card = this.createExpertCard(bot)
            grid.appendChild(card)
            this.loadBotAvatar(bot)
        })

        // Initialize carousel if on mobile
        if (this.isMobile()) {
            this.initializeCarousel()
        }
    }

    /**
     * Create an expert card element
     * @param {Object} bot - Bot configuration
     * @returns {HTMLElement} Card element
     */
    createExpertCard(bot) {
        const card = document.createElement('div')
        card.id = `expert-card-${bot.id}`
        card.className =
            'bg-white border border-gray-200 rounded-2xl pt-20 pb-8 px-8 text-center transition-all duration-300 relative hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 flex flex-col min-h-[320px] overflow-visible'

        card.innerHTML = `
            <div style="position: absolute; top: -40px; left: 50%; transform: translateX(-50%); width: 80px; height: 80px; z-index: 10;" id="avatar-container-${bot.id}">
                <div id="avatar-${bot.id}" style="width: 80px; height: 80px; border-radius: 50%; background-color: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; text-transform: uppercase; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">${this.getInitials(bot.name)}</div>
            </div>
            <h3 class="text-3xl font-bold text-slate-800 mb-2.5" id="expert-name-${bot.id}">${bot.name}</h3>
            <p class="text-base text-slate-500 leading-relaxed mb-6 min-h-12 flex-grow" id="expert-description-${bot.id}">${bot.description}</p>
            <button class="bg-brand-blue text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 w-full uppercase tracking-wider hover:bg-brand-blue-dark hover:scale-105 active:scale-95 mt-auto" id="btn-${bot.id}" onclick="chatManager.openChatbase('${bot.chatbaseId}', '${bot.id}')">
                <span id="btn-text-${bot.id}">HABLAR CON ${bot.name.toUpperCase()}</span>
            </button>
        `

        return card
    }

    /**
     * Load bot avatar image
     * @param {Object} bot - Bot configuration
     */
    loadBotAvatar(bot) {
        if (!bot.avatar) return

        const img = new Image()
        img.onload = () => {
            const avatarDiv = document.getElementById(`avatar-${bot.id}`)
            if (avatarDiv) {
                avatarDiv.outerHTML = `<img src="${bot.avatar}" alt="${bot.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; background-color: #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">`
            }
        }
        img.onerror = () => {
            // Avatar loading failed silently
        }
        img.src = bot.avatar
    }

    /**
     * Update floating chat button visibility and content
     */
    updateFloatingChatButton() {
        this.removeFloatingButton()

        if (this.currentBotId || !this.bots || this.bots.length === 0) return

        const targetBot = this.getTargetBotForFloatingButton()
        if (targetBot) {
            const buttonText = `Abrir ${targetBot.name}`
            this.createFloatingChatButton(targetBot, buttonText)
        }
    }

    /**
     * Get target bot for floating button
     * @returns {Object|null} Target bot
     */
    getTargetBotForFloatingButton() {
        if (this.lastMinimizedBotId && this.chatInstances[this.lastMinimizedBotId]) {
            return this.bots.find(b => b.id === this.lastMinimizedBotId)
        }
        return this.getDefaultBot()
    }

    /**
     * Remove existing floating button
     */
    removeFloatingButton() {
        // Remove any existing floating buttons (old pattern and new pattern)
        const existingButton = document.getElementById('floating-chat-button')
        if (existingButton) existingButton.remove()

        // Remove buttons with new ID pattern
        const floatingButtons = document.querySelectorAll('[id^="floating-chat-button-"]')
        floatingButtons.forEach(button => button.remove())
    }

    /**
     * Create floating chat button
     * @param {Object} bot - Bot configuration
     * @param {string} buttonText - Button title text
     */
    createFloatingChatButton(bot, buttonText) {
        const floatingButton = document.createElement('button')
        floatingButton.id = `floating-chat-button-${bot.id}`
        floatingButton.title = buttonText
        floatingButton.className =
            'fixed bottom-6 right-6 w-16 h-16 bg-brand-blue text-white border-none rounded-full cursor-pointer shadow-xl flex items-center justify-center transition-all duration-300 p-0 hover:bg-brand-blue-dark hover:scale-110 hover:shadow-2xl active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-lg disabled:hover:bg-gray-400 disabled:hover:scale-100 disabled:hover:shadow-lg'

        floatingButton.innerHTML = `<div class="i-heroicons-chat-bubble-left-ellipsis w-6 h-6" id="floating-chat-icon-${bot.id}"></div>`

        floatingButton.onclick = () => this.handleFloatingButtonClick(bot)
        document.body.appendChild(floatingButton)
    }

    /**
     * Handle floating button click
     * @param {Object} bot - Bot configuration
     */
    handleFloatingButtonClick(bot) {
        if (this.lastMinimizedBotId && this.chatInstances[this.lastMinimizedBotId]) {
            this.restoreChatInstance(this.lastMinimizedBotId)
        } else {
            this.openChatbase(bot.chatbaseId, bot.id)
        }
    }

    /**
     * Main function to open/minimize/restore Chatbase instances
     * @param {string} chatbotId - Chatbase bot ID
     * @param {string} botId - Internal bot ID
     */
    openChatbase(chatbotId, botId) {
        logger.log(`Opening chatbase for bot: ${botId}, chatbotId: ${chatbotId}`)

        if (this.isTransitioning) {
            logger.log('Transition in progress, ignoring click')
            return
        }

        const button = document.getElementById(`btn-${botId}`)

        if (this.chatInstances[botId]) {
            this.handleExistingInstance(botId)
            return
        }

        logger.log('Creating new instance')
        this.handleNewInstance(chatbotId, botId, button)
    }

    /**
     * Handle existing chat instance
     * @param {string} botId - Bot ID
     */
    handleExistingInstance(botId) {
        const instance = this.chatInstances[botId]
        logger.log(`Existing instance found. Visible: ${instance.isVisible}`)

        if (instance.isVisible) {
            logger.log('Minimizing visible instance')
            this.minimizeChatInstance(botId)
        } else {
            logger.log('Restoring minimized instance')
            this.restoreChatInstance(botId)
        }
    }

    /**
     * Handle new chat instance creation
     * @param {string} chatbotId - Chatbase bot ID
     * @param {string} botId - Internal bot ID
     * @param {HTMLElement} button - Button element
     */
    handleNewInstance(chatbotId, botId, button) {
        if (
            this.currentBotId &&
            this.currentBotId !== botId &&
            this.chatInstances[this.currentBotId] &&
            this.chatInstances[this.currentBotId].isVisible
        ) {
            logger.log(`Minimizing previous instance: ${this.currentBotId}`)
            this.minimizeChatInstance(this.currentBotId)
        }

        this.setButtonLoading(button, true)
        this.createChatInstance(chatbotId, botId)
    }

    /**
     * Set button loading state
     * @param {HTMLElement} button - Button element
     * @param {boolean} isLoading - Loading state
     */
    setButtonLoading(button, isLoading) {
        if (!button) return

        if (isLoading) {
            button.className =
                'bg-gray-500 text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-not-allowed transition-all duration-300 w-full uppercase tracking-wider relative flex items-center justify-center gap-2.5'
            button.disabled = true
            button.textContent = 'CARGANDO...'
        } else {
            button.className =
                'bg-brand-blue text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 w-full uppercase tracking-wider hover:bg-brand-blue-dark hover:scale-105 active:scale-95'
            button.disabled = false
        }
    }

    /**
     * Update button state based on chat instance state
     * @param {string} botId - Bot ID
     * @param {string} state - State: 'active', 'minimized', 'loading', 'default'
     */
    updateButtonState(botId, state) {
        logger.log(`Updating button state for bot: ${botId}, state: ${state}`)

        const button = document.getElementById(`btn-${botId}`)
        const bot = this.bots.find(b => b.id === botId)

        if (!button || !bot) {
            logger.error(`Button or bot not found. Button: ${!!button}, Bot: ${!!bot}`)
            return
        }

        button.disabled = false

        const buttonTextElement = button.querySelector(`#btn-text-${botId}`)

        const stateConfigs = {
            active: {
                className:
                    'bg-brand-green text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 w-full uppercase tracking-wider hover:bg-green-700 hover:scale-105 active:scale-95',
                text: `MINIMIZAR ${bot.name.toUpperCase()}`,
                disabled: false,
            },
            minimized: {
                className:
                    'bg-brand-orange text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 w-full uppercase tracking-wider hover:bg-brand-orange-dark hover:scale-105 active:scale-95',
                text: `HABLAR CON ${bot.name.toUpperCase()}`,
                disabled: false,
            },
            loading: {
                className:
                    'bg-gray-500 text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-not-allowed transition-all duration-300 w-full uppercase tracking-wider relative flex items-center justify-center gap-2.5',
                text: 'CARGANDO...',
                disabled: true,
            },
        }

        const config = stateConfigs[state] || {
            className:
                'bg-brand-blue text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 w-full uppercase tracking-wider hover:bg-brand-blue-dark hover:scale-105 active:scale-95',
            text: `HABLAR CON ${bot.name.toUpperCase()}`,
            disabled: false,
        }

        button.className = config.className
        if (buttonTextElement) {
            buttonTextElement.textContent = config.text
        } else {
            button.textContent = config.text
        }
        button.disabled = config.disabled

        logger.log(`Button updated for ${bot.name}`)
    }

    /**
     * Create chat instance with iframe
     * @param {string} chatbotId - Chatbase bot ID
     * @param {string} botId - Internal bot ID
     */
    createChatInstance(chatbotId, botId) {
        try {
            this.removeFloatingButton()

            if (CONFIG.IFRAME_MODE) {
                this.createIframeInstance(chatbotId, botId)
            } else {
                this.createWidgetInstance(chatbotId, botId)
            }

            this.currentBotId = botId
        } catch (error) {
            logger.error('Error creating chat instance:', error)
            this.updateButtonState(botId, 'default')
            this.isTransitioning = false
        }
    }

    /**
     * Create iframe-based chat instance
     * @param {string} chatbotId - Chatbase bot ID
     * @param {string} botId - Internal bot ID
     */
    createIframeInstance(chatbotId, botId) {
        const { chatContainer, iframe } = this.buildIframeElements(chatbotId, botId)
        const outsideClickHandler = this.createOutsideClickHandler(chatContainer, botId)

        document.body.appendChild(chatContainer)

        // Disable mobile scroll when chat opens
        this.disableMobileScroll()

        // Add outside click listener with delay
        const timeoutId = setTimeout(() => {
            // Check if document still exists (for test environment)
            if (typeof document !== 'undefined') {
                document.addEventListener('click', outsideClickHandler)
            }
        }, CONFIG.TRANSITION_DELAY)

        this.chatInstances[botId] = {
            container: chatContainer,
            iframe: iframe,
            isVisible: true,
            chatbotId: chatbotId,
            outsideClickHandler: outsideClickHandler,
            outsideClickTimeout: timeoutId,
        }
    }

    /**
     * Build iframe elements (container, iframe, close button)
     * @param {string} chatbotId - Chatbase bot ID
     * @param {string} botId - Internal bot ID
     * @returns {Object} Object with chatContainer and iframe elements
     */
    buildIframeElements(chatbotId, botId) {
        const chatContainer = this.createChatContainer(botId)
        const iframeContainer = this.createIframeContainer(botId)
        const iframe = this.createIframe(chatbotId, botId)
        const closeBtn = this.createCloseButton(botId)

        iframeContainer.appendChild(iframe)
        chatContainer.appendChild(iframeContainer)
        chatContainer.appendChild(closeBtn)

        return { chatContainer, iframe }
    }

    /**
     * Create chat container element
     * @param {string} botId - Bot ID
     * @returns {HTMLElement} Chat container
     */
    createChatContainer(botId) {
        const chatContainer = document.createElement('div')
        chatContainer.id = `chatbase-chat-container-${botId}`
        chatContainer.style.cssText = this.isMobile()
            ? STYLES.CHAT_CONTAINER_MOBILE
            : STYLES.CHAT_CONTAINER_DESKTOP
        return chatContainer
    }

    /**
     * Create iframe container element
     * @param {string} botId - Bot ID
     * @returns {HTMLElement} Iframe container
     */
    createIframeContainer(botId) {
        const iframeContainer = document.createElement('div')
        iframeContainer.id = `chatbase-iframe-container-${botId}`
        iframeContainer.style.cssText = this.isMobile()
            ? STYLES.IFRAME_CONTAINER_MOBILE
            : STYLES.IFRAME_CONTAINER
        return iframeContainer
    }

    /**
     * Create iframe element
     * @param {string} chatbotId - Chatbase bot ID
     * @param {string} botId - Internal bot ID
     * @returns {HTMLElement} Iframe element
     */
    createIframe(chatbotId, botId) {
        const iframe = document.createElement('iframe')
        iframe.id = `chatbase-iframe-${botId}`
        iframe.src = `${CONFIG.CHAT_BASE_URL}/chatbot-iframe/${chatbotId}`
        iframe.style.cssText = STYLES.IFRAME
        iframe.allow = 'microphone'

        iframe.onload = () => {
            this.updateButtonState(botId, 'active')
            this.updateFloatingChatButton()
            this.isTransitioning = false
        }

        iframe.onerror = () => {
            logger.error('Error loading Chatbase iframe')
            this.updateButtonState(botId, 'default')
            this.isTransitioning = false
        }

        return iframe
    }

    /**
     * Create close button element
     * @param {string} botId - Bot ID
     * @returns {HTMLElement} Close button
     */
    createCloseButton(botId) {
        const closeBtn = document.createElement('button')
        closeBtn.id = `close-btn-${botId}`
        closeBtn.innerHTML = `<div class="i-heroicons-chevron-down w-6 h-6" id="close-icon-${botId}"></div>`
        closeBtn.style.cssText = STYLES.CLOSE_BUTTON

        this.setupCloseButtonEvents(closeBtn, botId)
        return closeBtn
    }

    /**
     * Setup close button hover events
     * @param {HTMLElement} closeBtn - Close button element
     * @param {string} botId - Bot ID
     */
    setupCloseButtonEvents(closeBtn, botId) {
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#1d4ed8'
            closeBtn.style.transform = 'scale(1.1)'
            closeBtn.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)'
        })

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = '#2563eb'
            closeBtn.style.transform = 'scale(1)'
            closeBtn.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.3)'
        })

        closeBtn.onclick = () => this.minimizeChatInstance(botId)
    }

    /**
     * Create outside click handler for chat container
     * @param {HTMLElement} chatContainer - Chat container element
     * @param {string} botId - Bot ID
     * @returns {Function} Outside click handler
     */
    createOutsideClickHandler(chatContainer, botId) {
        return event => {
            // Disable outside click handler on mobile devices
            if (this.isMobile()) {
                return
            }

            if (!chatContainer.contains(event.target)) {
                this.minimizeChatInstance(botId)
                document.removeEventListener('click', this.chatInstances[botId].outsideClickHandler)
            }
        }
    }

    /**
     * Create widget-based chat instance (legacy support)
     * @param {string} chatbotId - Chatbase bot ID
     * @param {string} botId - Internal bot ID
     */
    createWidgetInstance(chatbotId, botId) {
        const chatbaseNamespace = `chatbase_${Date.now()}`

        window[chatbaseNamespace] = {
            chatbotId: chatbotId,
            domain: 'www.chatbase.co',
        }

        window.embeddedChatbotConfig = window[chatbaseNamespace]

        const script = document.createElement('script')
        script.src = `${CONFIG.CHAT_BASE_URL}/embed.min.js?${Date.now()}`
        script.setAttribute('chatbotId', chatbotId)
        script.setAttribute('domain', 'www.chatbase.co')
        script.defer = true
        script.id = `chatbase-script-${botId}`

        script.onload = () => {
            this.updateButtonState(botId, 'active')
            this.isTransitioning = false
        }

        script.onerror = () => {
            logger.error('Error loading Chatbase - switching to iframe mode')
            CONFIG.IFRAME_MODE = true
            this.updateButtonState(botId, 'default')
            this.isTransitioning = false
        }

        document.body.appendChild(script)

        this.chatInstances[botId] = {
            script: script,
            isVisible: true,
            chatbotId: chatbotId,
        }
    }

    /**
     * Minimize chat instance
     * @param {string} botId - Bot ID
     */
    minimizeChatInstance(botId) {
        logger.log(`Minimizing chat instance for bot: ${botId}`)

        const instance = this.chatInstances[botId]
        if (!instance) {
            logger.error(`No instance found for bot: ${botId}`)
            return
        }

        if (!this.validateInstanceContainer(instance, botId)) return

        this.hideInstance(instance, botId)
        this.updateInstanceState(botId, false)
    }

    /**
     * Validate instance container exists in DOM
     * @param {Object} instance - Chat instance
     * @param {string} botId - Bot ID
     * @returns {boolean} True if container is valid
     */
    validateInstanceContainer(instance, _botId) {
        if (!instance.container || !document.body.contains(instance.container)) {
            logger.error(`Container for bot not found in DOM during minimize`)
            return false
        }
        return true
    }

    /**
     * Hide chat instance
     * @param {Object} instance - Chat instance
     * @param {string} botId - Bot ID
     */
    hideInstance(instance, _botId) {
        // Clear any pending timeout
        if (instance.outsideClickTimeout) {
            clearTimeout(instance.outsideClickTimeout)
            instance.outsideClickTimeout = null
        }

        if (instance.outsideClickHandler) {
            document.removeEventListener('click', instance.outsideClickHandler)
        }

        logger.log(`Hiding container for bot`)
        instance.container.style.display = 'none'
        instance.isVisible = false

        // Enable mobile scroll when chat instance is hidden/minimized
        this.enableMobileScroll()
    }

    /**
     * Update instance state after minimize/restore
     * @param {string} botId - Bot ID
     * @param {boolean} isVisible - Visibility state
     */
    updateInstanceState(botId, isVisible) {
        this.updateButtonState(botId, isVisible ? 'active' : 'minimized')
        this.currentBotId = isVisible ? botId : null

        if (!isVisible) {
            this.lastMinimizedBotId = botId
        } else if (this.lastMinimizedBotId === botId) {
            this.lastMinimizedBotId = null
        }

        this.updateFloatingChatButton()
        logger.log(`Bot ${botId} ${isVisible ? 'restored' : 'minimized'} successfully`)
    }

    /**
     * Restore minimized chat instance
     * @param {string} botId - Bot ID
     */
    restoreChatInstance(botId) {
        logger.log(`Restoring chat instance for bot: ${botId}`)

        const instance = this.chatInstances[botId]
        if (!instance) {
            logger.error(`No instance found for bot: ${botId}`)
            return
        }

        this.removeFloatingButton()
        this.minimizeOtherInstances(botId)

        if (!this.validateAndRecreateInstance(instance, botId)) return

        this.showInstance(instance, botId)
        this.updateInstanceState(botId, true)
        this.reactivateOutsideClickListener(instance)
    }

    /**
     * Minimize other visible instances
     * @param {string} currentBotId - Current bot ID to exclude
     */
    minimizeOtherInstances(currentBotId) {
        if (
            this.currentBotId &&
            this.currentBotId !== currentBotId &&
            this.chatInstances[this.currentBotId] &&
            this.chatInstances[this.currentBotId].isVisible
        ) {
            logger.log(`Minimizing previous visible instance: ${this.currentBotId}`)
            this.minimizeChatInstance(this.currentBotId)
        }
    }

    /**
     * Validate instance and recreate if needed
     * @param {Object} instance - Chat instance
     * @param {string} botId - Bot ID
     * @returns {boolean} True if instance is valid or recreated
     */
    validateAndRecreateInstance(instance, botId) {
        if (!instance.container || !document.body.contains(instance.container)) {
            delete this.chatInstances[botId]
            const bot = this.bots.find(b => b.id === botId)
            if (bot) {
                logger.log(`Recreating instance for bot: ${botId}`)
                this.createChatInstance(bot.chatbaseId, botId)
            }
            return false
        }
        return true
    }

    /**
     * Show chat instance
     * @param {Object} instance - Chat instance
     * @param {string} botId - Bot ID
     */
    showInstance(instance, _botId) {
        logger.log(`Restoring bot ${_botId}, display before:`, instance.container.style.display)

        // Disable mobile scroll when chat instance is shown/restored
        this.disableMobileScroll()

        instance.container.style.display = 'flex'
        instance.container.style.visibility = 'visible'
        instance.isVisible = true

        logger.log(`Display after change:`, instance.container.style.display)
        logger.log(
            `Container visible on screen:`,
            instance.container.offsetWidth > 0 && instance.container.offsetHeight > 0
        )
    }

    /**
     * Reactivate outside click listener
     * @param {Object} instance - Chat instance
     */
    reactivateOutsideClickListener(instance) {
        if (instance.outsideClickHandler) {
            setTimeout(() => {
                document.addEventListener('click', instance.outsideClickHandler)
            }, CONFIG.TRANSITION_DELAY)
        }
    }

    /**
     * Completely destroy a chat instance
     * @param {string} botId - Bot ID
     */
    destroyChatInstance(botId) {
        const instance = this.chatInstances[botId]
        if (!instance) return

        this.removeInstanceEventListeners(instance)
        this.removeInstanceElements(instance)
        this.cleanupWidgetElements(instance, botId)

        // Enable mobile scroll when chat instance is completely destroyed
        this.enableMobileScroll()

        delete this.chatInstances[botId]
        this.updateButtonState(botId, 'default')

        if (this.currentBotId === botId) {
            this.currentBotId = null
        }
    }

    /**
     * Remove instance event listeners
     * @param {Object} instance - Chat instance
     */
    removeInstanceEventListeners(instance) {
        // Clear any pending timeout
        if (instance.outsideClickTimeout) {
            clearTimeout(instance.outsideClickTimeout)
            instance.outsideClickTimeout = null
        }

        if (instance.outsideClickHandler) {
            document.removeEventListener('click', instance.outsideClickHandler)
        }
    }

    /**
     * Remove instance DOM elements
     * @param {Object} instance - Chat instance
     */
    removeInstanceElements(instance) {
        if (instance.container) {
            instance.container.remove()
        }

        if (instance.script) {
            instance.script.remove()
        }

        if (instance.iframe) {
            instance.iframe.src = 'about:blank'
        }
    }

    /**
     * Clean up widget-specific elements
     * @param {Object} instance - Chat instance
     * @param {string} botId - Bot ID
     */
    cleanupWidgetElements(instance, botId) {
        if (!CONFIG.IFRAME_MODE) {
            const widgetSelectors = [
                `#chatbase-script-${botId}`,
                `[data-chatbot-id="${instance.chatbotId}"]`,
            ]

            widgetSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => el.remove())
            })
        }
    }

    /**
     * Clean up all chat instances
     */
    cleanupAllInstances() {
        try {
            Object.keys(this.chatInstances).forEach(botId => {
                this.destroyChatInstance(botId)
            })

            this.cleanupOrphanedElements()
            this.cleanupGlobalProperties()

            // Enable mobile scroll when all instances are cleaned up
            this.enableMobileScroll()

            this.chatInstances = {}
            this.currentBotId = null
        } catch (error) {
            logger.error('Error cleaning up instances:', error)
        }
    }

    /**
     * Clean up orphaned DOM elements
     */
    cleanupOrphanedElements() {
        const selectorsToClean = [
            '[id*="chatbase"]',
            '[id*="cb-"]',
            '[class*="chatbase"]',
            '[class*="cb-"]',
            'iframe[src*="chatbase.co"]',
            'script[src*="chatbase.co"]',
            'div[data-chatbase]',
            'button[data-chatbase]',
        ]

        selectorsToClean.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el.tagName === 'IFRAME') {
                    el.src = 'about:blank'
                }
                el.remove()
            })
        })
    }

    /**
     * Clean up global window properties
     */
    cleanupGlobalProperties() {
        Object.keys(window).forEach(key => {
            if (key.toLowerCase().includes('chatbase') || key.toLowerCase().includes('cb')) {
                try {
                    delete window[key]
                } catch {
                    window[key] = undefined
                }
            }
        })
    }

    /**
     * Clear all bots with confirmation
     */
    clearAllBots() {
        if (
            !confirm(
                '¿Estás seguro de que quieres eliminar todos los bots? Esta acción no se puede deshacer.'
            )
        ) {
            return
        }

        try {
            this.cleanupAllInstances()
            this.bots = []
            this.saveBots()
            this.renderExperts()
            this.renderBotList()
            this.updateFloatingChatButton()
            this.updateButtonStates()

            logger.log('All bots deleted')
        } catch (error) {
            logger.error('Error cleaning up instances:', error)
        }
    }

    /**
     * Import bots from JSON file
     */
    importFromFile() {
        const fileInput = document.getElementById('importFile')
        const file = fileInput.files[0]

        if (!this.validateImportFile(file)) return

        const reader = new FileReader()
        reader.onload = e => this.processImportFile(e, fileInput)
        reader.readAsText(file)
    }

    /**
     * Validate import file
     * @param {File} file - File to validate
     * @returns {boolean} True if file is valid
     */
    validateImportFile(file) {
        const validation = ValidationHelper.validateImportFile(file)
        if (!validation.isValid) {
            alert(validation.error)
            return false
        }
        return true
    }

    /**
     * Process import file content
     * @param {Event} e - FileReader load event
     * @param {HTMLElement} fileInput - File input element
     */
    processImportFile(e, fileInput) {
        try {
            const importedData = JSON.parse(e.target.result)

            if (!this.validateImportData(importedData)) return

            if (
                confirm(
                    `¿Estás seguro de que quieres importar ${importedData.length} bot(s)? Esto reemplazará la configuración actual.`
                )
            ) {
                this.executeImport(importedData, fileInput)
            }
        } catch (error) {
            logger.error('Error importing file:', error)
            alert('Error al procesar el archivo JSON. Verifica que el formato sea válido.')
        }
    }

    /**
     * Validate imported data structure
     * @param {Array} importedData - Data to validate
     * @returns {boolean} True if data is valid
     */
    validateImportData(importedData) {
        const validation = ValidationHelper.validateImportData(importedData)
        if (!validation.isValid) {
            alert(validation.error)
            return false
        }
        return true
    }

    /**
     * Execute import of validated data
     * @param {Array} importedData - Validated data to import
     * @param {HTMLElement} fileInput - File input to clear
     */
    executeImport(importedData, fileInput) {
        this.cleanupAllInstances()

        this.bots = importedData
        this.saveBots()
        this.renderExperts()
        this.renderBotList()
        this.updateFloatingChatButton()

        fileInput.value = ''
        this.updateButtonStates()

        alert(`Se importaron ${importedData.length} bot(s) correctamente`)
        logger.log('Data imported successfully:', importedData)
    }

    /**
     * Update button states based on conditions
     */
    updateButtonStates() {
        const importFile = document.getElementById('importFile')
        const importButton = document.getElementById('importButton')
        const clearAllButton = document.getElementById('clearAllButton')

        // Enable/disable import button based on file selection
        if (importFile && importButton) {
            const hasFile = importFile.files && importFile.files.length > 0
            if (hasFile) {
                importButton.disabled = false
                importButton.className =
                    'bg-brand-green text-white border-none px-5 py-2.5 rounded-md cursor-pointer text-sm font-semibold w-full transition-colors duration-300 hover:bg-green-700 mr-2.5 flex items-center justify-center gap-2'
                importButton.innerHTML =
                    '<div class="i-heroicons-arrow-down-tray w-4 h-4" id="import-button-icon"></div><span id="import-button-text">Importar datos</span>'
            } else {
                importButton.disabled = true
                importButton.className =
                    'bg-gray-400 text-white border-none px-5 py-2.5 rounded-md cursor-not-allowed text-sm font-semibold w-full transition-colors duration-300 mr-2.5 flex items-center justify-center gap-2'
                importButton.innerHTML =
                    '<div class="i-heroicons-arrow-down-tray w-4 h-4" id="import-button-icon"></div><span id="import-button-text">Importar datos</span>'
            }
        }

        // Enable/disable clear all button based on bots existence
        if (clearAllButton) {
            const hasBots = this.bots && this.bots.length > 0
            if (hasBots) {
                clearAllButton.disabled = false
                clearAllButton.className =
                    'bg-red-600 text-white border-none px-5 py-2.5 rounded-md cursor-pointer text-sm font-semibold w-full transition-colors duration-300 hover:bg-red-700 flex items-center justify-center gap-2'
                clearAllButton.innerHTML =
                    '<div class="i-heroicons-exclamation-triangle w-4 h-4" id="clear-all-icon"></div><span id="clear-all-text">Eliminar todos los bots</span>'
            } else {
                clearAllButton.disabled = true
                clearAllButton.className =
                    'bg-gray-400 text-white border-none px-5 py-2.5 rounded-md cursor-not-allowed text-sm font-semibold w-full transition-colors duration-300 flex items-center justify-center gap-2'
                clearAllButton.innerHTML =
                    '<div class="i-heroicons-exclamation-triangle w-4 h-4" id="clear-all-icon"></div><span id="clear-all-text">Eliminar todos los bots</span>'
            }
        }
    }

    /**
     * Open configuration modal
     */
    openConfig() {
        const modal = document.getElementById('configModal')
        modal.classList.remove('hidden')
        modal.classList.add('active')
        this.renderBotList()
        this.updateButtonStates()
        this.setupThemeSwitch()
    }

    /**
     * Close configuration modal
     */
    closeConfig() {
        const modal = document.getElementById('configModal')
        // Add closing class to trigger fade-out animation
        modal.classList.add('closing')
        setTimeout(() => {
            modal.classList.remove('active', 'closing')
            modal.classList.add('hidden')
        }, 150)
    }

    /**
     * Render bot list in configuration modal
     */
    renderBotList() {
        const botList = document.getElementById('botList')
        botList.innerHTML =
            '<h3 class="mb-2.5 text-lg text-slate-800 font-semibold" id="bot-list-title">Bots actuales</h3>'

        this.bots.forEach((bot, index) => {
            const botItem = this.createBotListItem(bot, index)
            botList.appendChild(botItem)
        })
    }

    /**
     * Create bot list item for configuration
     * @param {Object} bot - Bot configuration
     * @param {number} index - Bot index
     * @returns {HTMLElement} Bot list item
     */
    createBotListItem(bot, index) {
        const botItem = document.createElement('div')
        botItem.id = `bot-list-item-${bot.id}`

        // Apply different styles for default bot
        const borderClass = bot.isDefault ? 'border-2 border-brand-blue' : 'border border-gray-100'

        const backgroundClass = bot.isDefault
            ? 'bg-slate-50' // Color más sutil usando slate
            : 'bg-white'

        botItem.className = `${borderClass} ${backgroundClass} rounded-xl p-6 mb-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-200 relative`

        botItem.innerHTML = `
            <div class="flex-1" id="bot-info-${bot.id}">
                <div class="font-semibold text-slate-800 mb-1" id="bot-name-display-${bot.id}">${bot.name}</div>
                <div class="text-xs text-slate-500 font-mono" id="bot-id-display-${bot.id}">ID: ${bot.chatbaseId}</div>
                ${bot.avatar ? `<div class="text-xs text-slate-500 font-mono" id="bot-avatar-display-${bot.id}">Avatar: Personalizado</div>` : `<div class="text-xs text-slate-500 font-mono" id="bot-avatar-display-${bot.id}">Avatar: Iniciales</div>`}
                <div class="text-xs text-slate-500 mt-1" id="bot-description-display-${bot.id}">${bot.description}</div>
            </div>
            <div class="flex items-center gap-2" id="bot-actions-${bot.id}">
                ${
                    bot.isDefault
                        ? `<div class="bg-brand-blue text-white border-none px-3 py-1.5 rounded-md text-xs flex items-center justify-center" id="default-badge-${bot.id}">
                    <div class="i-heroicons-check-circle w-3 h-3"></div>
                </div>`
                        : ''
                }
                <button class="bg-green-500 text-white border-none px-3 py-1.5 rounded-md cursor-pointer text-xs transition-colors duration-300 hover:bg-green-600 flex items-center justify-center" onclick="chatManager.editBot(${index})" id="edit-bot-btn-${bot.id}" title="Editar bot">
                    <div class="i-heroicons-pencil w-3 h-3" id="edit-bot-icon-${bot.id}"></div>
                </button>
                <button class="bg-brand-blue text-white border-none px-3 py-1.5 rounded-md cursor-pointer text-xs transition-colors duration-300 hover:bg-brand-blue-dark flex items-center justify-center" onclick="chatManager.setDefaultBot('${bot.id}')" id="set-default-btn-${bot.id}" ${bot.isDefault ? 'style="display: none;"' : ''} title="Establecer como predeterminado">
                    <div class="i-heroicons-star w-3 h-3" id="set-default-icon-${bot.id}"></div>
                </button>
                <button class="bg-red-500 text-white border-none px-3 py-1.5 rounded-md cursor-pointer text-xs transition-colors duration-300 hover:bg-red-600 flex items-center justify-center" onclick="chatManager.deleteBot(${index})" id="delete-bot-btn-${bot.id}" title="Eliminar bot">
                    <div class="i-heroicons-trash w-3 h-3" id="delete-bot-icon-${bot.id}"></div>
                </button>
            </div>
        `
        return botItem
    }

    /**
     * Add new bot from form
     */
    addBot() {
        const formData = this.getFormData()

        if (!this.validateBotForm(formData)) return

        const newBot = this.createBotFromForm(formData)

        this.bots.push(newBot)
        this.saveBots()
        this.renderExperts()
        this.renderBotList()
        this.clearBotForm()
        this.updateButtonStates()
    }

    /**
     * Get form data for new bot
     * @returns {Object} Form data
     */
    getFormData() {
        return {
            name: document.getElementById('botName').value.trim(),
            description: document.getElementById('botDescription').value.trim(),
            avatar: document.getElementById('botAvatar').value.trim(),
            chatbaseId: document.getElementById('botId').value.trim(),
        }
    }

    /**
     * Validate bot form data
     * @param {Object} formData - Form data to validate
     * @returns {boolean} True if valid
     */
    validateBotForm(formData) {
        const validation = ValidationHelper.validateBotForm(formData)
        if (!validation.isValid) {
            alert(validation.errors.join('\n'))
            return false
        }
        return true
    }

    /**
     * Create bot object from form data
     * @param {Object} formData - Form data
     * @returns {Object} Bot object
     */
    createBotFromForm(formData) {
        return {
            id: formData.name.toLowerCase().replace(/\s/g, '-'),
            name: formData.name,
            description: formData.description,
            chatbaseId: formData.chatbaseId,
            avatar: formData.avatar || null,
            isDefault: false,
        }
    }

    /**
     * Clear bot form inputs
     */
    clearBotForm() {
        document.getElementById('botName').value = ''
        document.getElementById('botDescription').value = ''
        document.getElementById('botAvatar').value = ''
        document.getElementById('botId').value = ''
    }

    /**
     * Edit bot by index
     * @param {number} index - Bot index to edit
     */
    editBot(index) {
        const bot = this.bots[index]
        if (!bot) return

        // Populate form with current bot data
        document.getElementById('botName').value = bot.name
        document.getElementById('botDescription').value = bot.description
        document.getElementById('botAvatar').value = bot.avatar || ''
        document.getElementById('botId').value = bot.chatbaseId

        // Change button text and function to update instead of add
        const addButton = document.getElementById('add-bot-button')
        addButton.textContent = 'Actualizar Bot'
        addButton.onclick = () => this.updateBot(index)

        // Change section title
        const sectionTitle = document.getElementById('add-bot-title')
        sectionTitle.textContent = `Editando: ${bot.name}`

        // Show cancel button
        this.showCancelEditButton()
    }

    /**
     * Show cancel edit button
     */
    showCancelEditButton() {
        // Check if cancel button already exists
        if (document.getElementById('cancel-edit-button')) return

        const addButton = document.getElementById('add-bot-button')
        const cancelButton = document.createElement('button')
        cancelButton.id = 'cancel-edit-button'
        cancelButton.className =
            'bg-gray-500 text-white border-none px-5 py-2.5 rounded-md cursor-pointer text-sm font-semibold w-full transition-colors duration-300 hover:bg-gray-600 mt-2'
        cancelButton.textContent = 'Cancelar Edición'
        cancelButton.onclick = () => this.cancelEdit()

        addButton.parentNode.insertBefore(cancelButton, addButton.nextSibling)
    }

    /**
     * Cancel edit mode
     */
    cancelEdit() {
        // Clear form
        this.clearBotForm()

        // Reset button
        const addButton = document.getElementById('add-bot-button')
        addButton.textContent = 'Agregar Bot'
        addButton.onclick = () => this.addBot()

        // Reset section title
        const sectionTitle = document.getElementById('add-bot-title')
        sectionTitle.textContent = 'Agregar nuevo bot'

        // Remove cancel button
        const cancelButton = document.getElementById('cancel-edit-button')
        if (cancelButton) {
            cancelButton.remove()
        }
    }

    /**
     * Update bot by index
     * @param {number} index - Bot index to update
     */
    updateBot(index) {
        const formData = this.getFormData()

        if (!this.validateBotForm(formData)) return

        const originalBot = this.bots[index]
        const updatedBot = {
            ...originalBot,
            name: formData.name,
            description: formData.description,
            chatbaseId: formData.chatbaseId,
            avatar: formData.avatar || null,
        }

        // Update the ID if name changed
        updatedBot.id = formData.name.toLowerCase().replace(/\s/g, '-')

        // If ID changed, clean up old chat instance
        if (originalBot.id !== updatedBot.id && this.chatInstances[originalBot.id]) {
            this.destroyChatInstance(originalBot.id)
        }

        this.bots[index] = updatedBot
        this.saveBots()
        this.renderExperts()
        this.renderBotList()
        this.cancelEdit()
        this.updateButtonStates()
    }

    /**
     * Generate configuration URL with all bots
     */
    generateConfigURL() {
        if (!this.bots || this.bots.length === 0) {
            alert('No hay bots configurados para exportar')
            return
        }

        try {
            const baseURL = window.location.origin + window.location.pathname
            const urlParams = new URLSearchParams()

            this.bots.forEach((bot, index) => {
                const botData = {
                    id: bot.id,
                    name: bot.name,
                    description: bot.description,
                    chatbaseId: bot.chatbaseId,
                }

                // Add avatar only if it exists
                if (bot.avatar) {
                    botData.avatarUrl = bot.avatar
                }

                // Add isDefault only if true
                if (bot.isDefault) {
                    botData.isDefault = true
                }

                urlParams.set(`bot_${index + 1}`, JSON.stringify(botData))
            })

            const fullURL = `${baseURL}?${urlParams.toString()}`

            // Copy to clipboard
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard
                    .writeText(fullURL)
                    .then(() => {
                        this.showURLCopySuccess(fullURL)
                    })
                    .catch(() => {
                        this.showURLCopyFallback(fullURL)
                    })
            } else {
                this.showURLCopyFallback(fullURL)
            }
        } catch (error) {
            logger.error('Error generating config URL:', error)
            alert('Error al generar la URL de configuración')
        }
    }

    /**
     * Show success message when URL is copied
     * @param {string} url - The copied URL
     */
    showURLCopySuccess(url) {
        const button = document.getElementById('export-url-button')
        const originalText = button.innerHTML

        button.innerHTML = '<div class="i-heroicons-check w-4 h-4"></div><span>¡URL copiada!</span>'
        button.className = button.className.replace(
            'bg-purple-600 hover:bg-purple-700',
            'bg-green-600 hover:bg-green-700'
        )

        setTimeout(() => {
            button.innerHTML = originalText
            button.className = button.className.replace(
                'bg-green-600 hover:bg-green-700',
                'bg-purple-600 hover:bg-purple-700'
            )
        }, 2000)

        logger.log('URL generada:', url)
    }

    /**
     * Show fallback when clipboard API is not available
     * @param {string} url - The URL to show
     */
    showURLCopyFallback(url) {
        // Create a temporary textarea to select and copy
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
            document.execCommand('copy')
            this.showURLCopySuccess(url)
        } catch (_err) {
            // If copy fails, show the URL in a prompt
            prompt('Copia esta URL para compartir la configuración:', url)
        }

        document.body.removeChild(textArea)
    }

    /**
     * Delete bot by index
     * @param {number} index - Bot index to delete
     */
    deleteBot(index) {
        if (!confirm('¿Estás seguro de que quieres eliminar este bot?')) return

        const botToDelete = this.bots[index]

        if (botToDelete && this.chatInstances[botToDelete.id]) {
            this.destroyChatInstance(botToDelete.id)
        }

        this.bots.splice(index, 1)
        this.saveBots()
        this.renderExperts()
        this.renderBotList()
        this.updateButtonStates()
    }

    /**
     * Debug function to inspect chat instances state
     */
    debugChatInstances() {
        // Only run in development
        if (import.meta.env.PROD) return

        logger.log('=== Chat Instances Debug ===')
        logger.log('Current Bot ID:', this.currentBotId)
        logger.log('Use Iframe Mode:', CONFIG.IFRAME_MODE)
        logger.log('Chat Instances:', Object.keys(this.chatInstances))

        Object.entries(this.chatInstances).forEach(([botId, instance]) => {
            logger.log(`\nBot ${botId}:`)
            logger.log('- Is Visible:', instance.isVisible)
            logger.log('- Has Container:', !!instance.container)
            logger.log(
                '- Container in DOM:',
                instance.container ? document.body.contains(instance.container) : false
            )
            logger.log(
                '- Container Display:',
                instance.container ? instance.container.style.display : 'N/A'
            )
            logger.log('- Chatbot ID:', instance.chatbotId)
        })
        logger.log('=======================')
    }

    /**
     * Initialize carousel functionality for mobile
     */
    initializeCarousel() {
        this.currentCarouselIndex = 0
        this.cleanupCarouselListeners()
        this.setupCarouselControls()
        this.setupCarouselScrollListener()
        this.updateCarouselIndicators()
    }

    /**
     * Cleanup carousel event listeners
     */
    cleanupCarouselListeners() {
        const prevButton = document.getElementById('carouselPrev')
        const nextButton = document.getElementById('carouselNext')
        const grid = document.getElementById('expertsGrid')

        // Remove old event listeners by cloning elements
        if (prevButton) {
            const newPrev = prevButton.cloneNode(true)
            prevButton.parentNode.replaceChild(newPrev, prevButton)
        }

        if (nextButton) {
            const newNext = nextButton.cloneNode(true)
            nextButton.parentNode.replaceChild(newNext, nextButton)
        }

        if (grid && this.scrollListener) {
            grid.removeEventListener('scroll', this.scrollListener)
            this.scrollListener = null
        }
    }

    /**
     * Setup carousel control buttons
     */
    setupCarouselControls() {
        const prevButton = document.getElementById('carouselPrev')
        const nextButton = document.getElementById('carouselNext')

        if (prevButton) {
            prevButton.addEventListener('click', () => this.navigateCarousel('prev'))
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => this.navigateCarousel('next'))
        }

        // Generate dot indicators
        this.generateCarouselDots()
    }

    /**
     * Generate carousel dot indicators
     */
    generateCarouselDots() {
        const dotsContainer = document.getElementById('carouselDots')
        if (!dotsContainer) {
            logger.error('Carousel dots container not found')
            return
        }

        dotsContainer.innerHTML = ''

        logger.log(`Generating ${this.bots.length} carousel dots`)

        this.bots.forEach((_, index) => {
            const dot = document.createElement('button')
            dot.type = 'button'
            dot.className =
                'w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-300 hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 dark:focus:ring-blue-500'
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`)
            dot.setAttribute('data-carousel-dot', index)
            dot.addEventListener('click', () => this.goToCarouselSlide(index))
            dotsContainer.appendChild(dot)
        })

        // Set initial active dot
        if (dotsContainer.children[0]) {
            dotsContainer.children[0].className =
                'w-6 h-2 rounded bg-brand-blue dark:bg-blue-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 dark:focus:ring-blue-500'
        }
    }

    /**
     * Setup scroll listener for carousel
     */
    setupCarouselScrollListener() {
        const grid = document.getElementById('expertsGrid')
        if (!grid) return

        let isScrolling = null

        this.scrollListener = () => {
            // Clear our timeout throughout the scroll
            window.clearTimeout(isScrolling)

            // Set a timeout to run after scrolling ends
            isScrolling = setTimeout(() => {
                this.updateCarouselOnScroll()
            }, 66)
        }

        grid.addEventListener('scroll', this.scrollListener)
    }

    /**
     * Update carousel index based on scroll position
     */
    updateCarouselOnScroll() {
        const grid = document.getElementById('expertsGrid')
        if (!grid) return

        const cards = grid.querySelectorAll(':scope > div')
        if (cards.length === 0) return

        const scrollLeft = grid.scrollLeft
        const containerWidth = grid.offsetWidth

        // Find which card is most visible
        let closestIndex = 0
        let closestDistance = Infinity

        cards.forEach((card, index) => {
            const cardLeft = card.offsetLeft - grid.offsetLeft
            const cardCenter = cardLeft + card.offsetWidth / 2
            const containerCenter = scrollLeft + containerWidth / 2
            const distance = Math.abs(cardCenter - containerCenter)

            if (distance < closestDistance) {
                closestDistance = distance
                closestIndex = index
            }
        })

        this.currentCarouselIndex = closestIndex
        this.updateCarouselIndicators()
    }

    /**
     * Navigate carousel
     * @param {string} direction - 'prev' or 'next'
     */
    navigateCarousel(direction) {
        const totalSlides = this.bots.length

        if (direction === 'prev') {
            this.currentCarouselIndex = Math.max(0, this.currentCarouselIndex - 1)
        } else {
            this.currentCarouselIndex = Math.min(totalSlides - 1, this.currentCarouselIndex + 1)
        }

        this.goToCarouselSlide(this.currentCarouselIndex)
    }

    /**
     * Go to specific carousel slide
     * @param {number} index - Slide index
     */
    goToCarouselSlide(index) {
        const grid = document.getElementById('expertsGrid')
        if (!grid) return

        const cards = grid.querySelectorAll(':scope > div')
        if (cards[index]) {
            cards[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            })
        }

        this.currentCarouselIndex = index
        this.updateCarouselIndicators()
    }

    /**
     * Update carousel indicators (dots and buttons)
     */
    updateCarouselIndicators() {
        // Update dots
        const dotsContainer = document.getElementById('carouselDots')
        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('button[data-carousel-dot]')
            dots.forEach((dot, index) => {
                if (index === this.currentCarouselIndex) {
                    // Active state
                    dot.className =
                        'w-6 h-2 rounded bg-brand-blue dark:bg-blue-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 dark:focus:ring-blue-500'
                } else {
                    // Inactive state
                    dot.className =
                        'w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-300 hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 dark:focus:ring-blue-500'
                }
            })
        }

        // Update prev/next buttons
        const prevButton = document.getElementById('carouselPrev')
        const nextButton = document.getElementById('carouselNext')

        if (prevButton) {
            prevButton.disabled = this.currentCarouselIndex === 0
        }

        if (nextButton) {
            nextButton.disabled = this.currentCarouselIndex === this.bots.length - 1
        }
    }
}

// Initialize the application
const chatManager = new ChatbaseManager()

// Global functions for HTML onclick handlers
window.chatManager = chatManager
window.openChatbase = (chatbotId, botId) => chatManager.openChatbase(chatbotId, botId)
window.openConfig = () => chatManager.openConfig()
window.closeConfig = () => chatManager.closeConfig()
window.addBot = () => chatManager.addBot()
window.editBot = index => chatManager.editBot(index)
window.deleteBot = index => chatManager.deleteBot(index)
window.setDefaultBot = botId => chatManager.setDefaultBot(botId)
window.clearAllBots = () => chatManager.clearAllBots()
window.importFromFile = () => chatManager.importFromFile()
window.debugChatInstances = () => chatManager.debugChatInstances()

// Expose bot management functions for URL parameter loading
window.loadBots = () => chatManager.loadBots()
window.saveBots = bots => chatManager.saveBots(bots)
window.renderBotGrid = () => chatManager.renderExperts()

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    logger.log('Chatbase Manager initialized')
})

// Export for testing
export { ChatbaseManager, chatManager }
