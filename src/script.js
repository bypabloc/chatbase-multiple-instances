import { inject } from '@vercel/analytics'
import 'uno.css'

inject()

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
        bottom: 10px;
        right: 10px;
        left: 10px;
        width: calc(100vw - 20px);
        height: calc(100vh - 100px);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
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
    `,
    IFRAME: `
        width: 100%;
        height: 100%;
        border: none;
    `,
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
        this.init()
    }

    /**
     * Initialize the manager and load saved bots
     */
    init() {
        this.loadBots()
        this.setupEventListeners()
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        window.addEventListener('beforeunload', () => this.cleanupAllInstances())
        window.onclick = event => this.handleModalClick(event)
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
     * Load bots from localStorage
     */
    loadBots() {
        try {
            const savedBots = localStorage.getItem(CONFIG.STORAGE_KEY)
            this.bots = savedBots ? JSON.parse(savedBots) : []
            this.renderExperts()
            this.updateFloatingChatButton()
        } catch (error) {
            console.error('Error loading bots:', error)
            this.bots = []
            this.renderExperts()
            this.updateFloatingChatButton()
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
    }

    /**
     * Create an expert card element
     * @param {Object} bot - Bot configuration
     * @returns {HTMLElement} Card element
     */
    createExpertCard(bot) {
        const card = document.createElement('div')
        card.className =
            'bg-white border border-gray-200 rounded-2xl p-8 text-center transition-all duration-300 relative hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5'

        card.innerHTML = `
            <div class="w-10 h-10 mx-auto mb-5">
                <div id="avatar-${bot.id}" class="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center text-sm font-bold uppercase">${this.getInitials(bot.name)}</div>
            </div>
            <h3 class="text-3xl font-bold text-slate-800 mb-2.5">${bot.name}</h3>
            <p class="text-base text-slate-500 leading-relaxed mb-6 min-h-12">${bot.description}</p>
            <button class="bg-brand-blue text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 w-full uppercase tracking-wider hover:bg-brand-blue-dark hover:scale-105 active:scale-95" id="btn-${bot.id}" onclick="chatManager.openChatbase('${bot.chatbaseId}', '${bot.id}')">
                HABLAR CON ${bot.name.toUpperCase()}
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
                avatarDiv.outerHTML = `<img src="${bot.avatar}" alt="${bot.name}" class="w-10 h-10 rounded-full object-cover bg-gray-200">`
            }
        }
        img.onerror = () => {
            console.log(`Could not load avatar for ${bot.name}`)
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
        const existingButton = document.getElementById('floating-chat-button')
        if (existingButton) existingButton.remove()
    }

    /**
     * Create floating chat button
     * @param {Object} bot - Bot configuration
     * @param {string} buttonText - Button title text
     */
    createFloatingChatButton(bot, buttonText) {
        const floatingButton = document.createElement('button')
        floatingButton.id = 'floating-chat-button'
        floatingButton.title = buttonText
        floatingButton.className =
            'fixed bottom-6 right-6 w-16 h-16 bg-brand-blue text-white border-none rounded-full cursor-pointer shadow-xl flex items-center justify-center transition-all duration-300 z-[9999] p-0 hover:bg-brand-blue-dark hover:scale-110 hover:shadow-2xl active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-lg disabled:hover:bg-gray-400 disabled:hover:scale-100 disabled:hover:shadow-lg'

        floatingButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `

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
        console.log(`Opening chatbase for bot: ${botId}, chatbotId: ${chatbotId}`)

        if (this.isTransitioning) {
            console.log('Transition in progress, ignoring click')
            return
        }

        const button = document.getElementById(`btn-${botId}`)

        if (this.chatInstances[botId]) {
            this.handleExistingInstance(botId)
            return
        }

        console.log('Creating new instance')
        this.handleNewInstance(chatbotId, botId, button)
    }

    /**
     * Handle existing chat instance
     * @param {string} botId - Bot ID
     */
    handleExistingInstance(botId) {
        const instance = this.chatInstances[botId]
        console.log(`Existing instance found. Visible: ${instance.isVisible}`)

        if (instance.isVisible) {
            console.log('Minimizing visible instance')
            this.minimizeChatInstance(botId)
        } else {
            console.log('Restoring minimized instance')
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
            console.log(`Minimizing previous instance: ${this.currentBotId}`)
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
        console.log(`Updating button state for bot: ${botId}, state: ${state}`)

        const button = document.getElementById(`btn-${botId}`)
        const bot = this.bots.find(b => b.id === botId)

        if (!button || !bot) {
            console.error(`Button or bot not found. Button: ${!!button}, Bot: ${!!bot}`)
            return
        }

        button.disabled = false

        switch (state) {
            case 'active':
                button.className =
                    'bg-brand-green text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 w-full uppercase tracking-wider hover:bg-green-700 hover:scale-105 active:scale-95'
                button.textContent = `MINIMIZAR ${bot.name.toUpperCase()}`
                break
            case 'minimized':
                button.className =
                    'bg-brand-orange text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 w-full uppercase tracking-wider hover:bg-brand-orange-dark hover:scale-105 active:scale-95'
                button.textContent = `HABLAR CON ${bot.name.toUpperCase()}`
                break
            case 'loading':
                button.className =
                    'bg-gray-500 text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-not-allowed transition-all duration-300 w-full uppercase tracking-wider relative flex items-center justify-center gap-2.5'
                button.textContent = 'CARGANDO...'
                button.disabled = true
                break
            default:
                button.className =
                    'bg-brand-blue text-white border-none px-8 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 w-full uppercase tracking-wider hover:bg-brand-blue-dark hover:scale-105 active:scale-95'
                button.textContent = `HABLAR CON ${bot.name.toUpperCase()}`
        }

        console.log(`Button updated for ${bot.name}`)
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
            console.error('Error creating chat instance:', error)
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

        // Add outside click listener with delay
        setTimeout(() => {
            document.addEventListener('click', outsideClickHandler)
        }, CONFIG.TRANSITION_DELAY)

        this.chatInstances[botId] = {
            container: chatContainer,
            iframe: iframe,
            isVisible: true,
            chatbotId: chatbotId,
            outsideClickHandler: outsideClickHandler,
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
        iframeContainer.style.cssText = STYLES.IFRAME_CONTAINER
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
        iframe.src = `${CONFIG.CHAT_BASE_URL}/chatbot-iframe/${chatbotId}`
        iframe.style.cssText = STYLES.IFRAME
        iframe.allow = 'microphone'

        iframe.onload = () => {
            this.updateButtonState(botId, 'active')
            this.updateFloatingChatButton()
            this.isTransitioning = false
        }

        iframe.onerror = () => {
            this.updateButtonState(botId, 'default')
            this.isTransitioning = false
            console.error('Error loading Chatbase iframe')
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
        closeBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `
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
            console.error('Error loading Chatbase - switching to iframe mode')
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
        console.log(`Minimizing chat instance for bot: ${botId}`)

        const instance = this.chatInstances[botId]
        if (!instance) {
            console.error(`No instance found for bot: ${botId}`)
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
    validateInstanceContainer(instance, botId) {
        if (!instance.container || !document.body.contains(instance.container)) {
            console.error(`Container for bot ${botId} not found in DOM during minimize`)
            return false
        }
        return true
    }

    /**
     * Hide chat instance
     * @param {Object} instance - Chat instance
     * @param {string} botId - Bot ID
     */
    hideInstance(instance, botId) {
        if (instance.outsideClickHandler) {
            document.removeEventListener('click', instance.outsideClickHandler)
        }

        console.log(`Hiding container for bot ${botId}`)
        instance.container.style.display = 'none'
        instance.isVisible = false
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
        console.log(`Bot ${botId} ${isVisible ? 'restored' : 'minimized'} successfully`)
    }

    /**
     * Restore minimized chat instance
     * @param {string} botId - Bot ID
     */
    restoreChatInstance(botId) {
        console.log(`Restoring chat instance for bot: ${botId}`)

        const instance = this.chatInstances[botId]
        if (!instance) {
            console.error(`No instance found for bot: ${botId}`)
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
            console.log(`Minimizing previous visible instance: ${this.currentBotId}`)
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
            console.error(`Container for bot ${botId} no longer exists in DOM. Recreating...`)
            delete this.chatInstances[botId]
            const bot = this.bots.find(b => b.id === botId)
            if (bot) {
                console.log(`Recreating instance for bot: ${botId}`)
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
    showInstance(instance, botId) {
        console.log(`Restoring bot ${botId}, display before:`, instance.container.style.display)
        instance.container.style.display = 'flex'
        instance.container.style.visibility = 'visible'
        instance.isVisible = true

        console.log(`Display after change:`, instance.container.style.display)
        console.log(
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

            this.chatInstances = {}
            this.currentBotId = null
        } catch (error) {
            console.error('Error cleaning up instances:', error)
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

            console.log('All bots deleted')
        } catch (error) {
            console.error('Error deleting bots:', error)
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
        if (!file) {
            alert('Por favor selecciona un archivo JSON')
            return false
        }

        if (!file.name.toLowerCase().endsWith('.json')) {
            alert('El archivo debe ser de tipo JSON')
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
            console.error('Error importing file:', error)
            alert('Error al procesar el archivo JSON. Verifica que el formato sea válido.')
        }
    }

    /**
     * Validate imported data structure
     * @param {Array} importedData - Data to validate
     * @returns {boolean} True if data is valid
     */
    validateImportData(importedData) {
        if (!Array.isArray(importedData)) {
            alert('El archivo JSON debe contener un array de bots')
            return false
        }

        const isValidData = importedData.every(bot => {
            return (
                bot &&
                typeof bot === 'object' &&
                typeof bot.id === 'string' &&
                typeof bot.name === 'string' &&
                typeof bot.description === 'string' &&
                typeof bot.chatbaseId === 'string' &&
                (bot.avatar === null || typeof bot.avatar === 'string') &&
                typeof bot.isDefault === 'boolean'
            )
        })

        if (!isValidData) {
            alert(
                'El archivo JSON no tiene el formato correcto. Cada bot debe tener: id, name, description, chatbaseId, avatar, isDefault'
            )
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

        alert(`Se importaron ${importedData.length} bot(s) correctamente`)
        console.log('Data imported successfully:', importedData)
    }

    /**
     * Open configuration modal
     */
    openConfig() {
        const modal = document.getElementById('configModal')
        modal.classList.remove('hidden')
        modal.classList.add('active')
        this.renderBotList()
    }

    /**
     * Close configuration modal
     */
    closeConfig() {
        const modal = document.getElementById('configModal')
        modal.classList.remove('active')
        setTimeout(() => modal.classList.add('hidden'), 300)
    }

    /**
     * Render bot list in configuration modal
     */
    renderBotList() {
        const botList = document.getElementById('botList')
        botList.innerHTML =
            '<h3 class="mb-2.5 text-lg text-slate-800 font-semibold">Bots actuales</h3>'

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
        botItem.className =
            'bg-slate-50 border border-gray-200 rounded-lg p-4 mb-2.5 flex justify-between items-center'
        botItem.innerHTML = `
            <div class="flex-1">
                <div class="font-semibold text-slate-800 mb-1">${bot.name}</div>
                <div class="text-xs text-slate-500 font-mono">ID: ${bot.chatbaseId}</div>
                ${bot.avatar ? '<div class="text-xs text-slate-500 font-mono">Avatar: Personalizado</div>' : '<div class="text-xs text-slate-500 font-mono">Avatar: Iniciales</div>'}
            </div>
            <div class="flex items-center gap-4">
                <label class="flex items-center gap-1 cursor-pointer text-xs text-slate-500">
                    <input type="radio" name="defaultBot" value="${bot.id}" ${bot.isDefault ? 'checked' : ''} 
                           onchange="chatManager.setDefaultBot('${bot.id}')" class="m-0 cursor-pointer">
                    <span class="select-none">Por defecto</span>
                </label>
                <button class="bg-red-500 text-white border-none px-3 py-1.5 rounded-md cursor-pointer text-xs transition-colors duration-300 hover:bg-red-600" onclick="chatManager.deleteBot(${index})">Eliminar</button>
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
        if (!formData.name || !formData.description || !formData.chatbaseId) {
            alert('Por favor, completa todos los campos obligatorios')
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
    }

    /**
     * Debug function to inspect chat instances state
     */
    debugChatInstances() {
        console.log('=== Chat Instances Debug ===')
        console.log('Current Bot ID:', this.currentBotId)
        console.log('Use Iframe Mode:', CONFIG.IFRAME_MODE)
        console.log('Chat Instances:', Object.keys(this.chatInstances))

        Object.entries(this.chatInstances).forEach(([botId, instance]) => {
            console.log(`\nBot ${botId}:`)
            console.log('- Is Visible:', instance.isVisible)
            console.log('- Has Container:', !!instance.container)
            console.log(
                '- Container in DOM:',
                instance.container ? document.body.contains(instance.container) : false
            )
            console.log(
                '- Container Display:',
                instance.container ? instance.container.style.display : 'N/A'
            )
            console.log('- Chatbot ID:', instance.chatbotId)
        })
        console.log('=======================')
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
window.deleteBot = index => chatManager.deleteBot(index)
window.setDefaultBot = botId => chatManager.setDefaultBot(botId)
window.clearAllBots = () => chatManager.clearAllBots()
window.importFromFile = () => chatManager.importFromFile()
window.debugChatInstances = () => chatManager.debugChatInstances()

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Chatbase Manager initialized')
})
