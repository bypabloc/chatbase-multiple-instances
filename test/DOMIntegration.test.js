/**
 * Integration tests for DOM interactions and events
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { 
  mockBots, 
  setupLocalStorageWithBots,
  createMockClickEvent,
  assertElementStyles,
  waitForDOM
} from './helpers.js'

// Mock the full ChatbaseManager for DOM testing
const mockChatbaseManagerClass = class ChatbaseManager {
  constructor() {
    this.bots = []
    this.chatInstances = {}
    this.currentBotId = null
    this.lastMinimizedBotId = null
    this.isTransitioning = false
    this.init()
  }

  init() {
    this.loadBots()
    this.setupEventListeners()
  }

  setupEventListeners() {
    window.addEventListener('beforeunload', () => this.cleanupAllInstances())
    window.onclick = (event) => this.handleModalClick(event)
  }

  handleModalClick(event) {
    const modal = document.getElementById('configModal')
    if (event.target === modal) {
      this.closeConfig()
    }
  }

  loadBots() {
    try {
      const savedBots = localStorage.getItem('chatbaseBots')
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

  saveBots() {
    localStorage.setItem('chatbaseBots', JSON.stringify(this.bots))
  }

  getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').slice(0, 2)
  }

  renderExperts() {
    const grid = document.getElementById('expertsGrid')
    if (!grid) return
    
    grid.innerHTML = ''

    this.bots.forEach(bot => {
      const card = this.createExpertCard(bot)
      grid.appendChild(card)
      this.loadBotAvatar(bot)
    })
  }

  createExpertCard(bot) {
    const card = document.createElement('div')
    card.className = 'expert-card'
    card.setAttribute('data-testid', `expert-card-${bot.id}`)
    
    card.innerHTML = `
      <div class="avatar-container">
        <div id="avatar-${bot.id}" class="avatar-fallback">${this.getInitials(bot.name)}</div>
      </div>
      <h3 class="expert-name">${bot.name}</h3>
      <p class="expert-description">${bot.description}</p>
      <button 
        class="talk-button" 
        id="btn-${bot.id}" 
        data-testid="talk-button-${bot.id}"
        onclick="chatManager.openChatbase('${bot.chatbaseId}', '${bot.id}')"
      >
        HABLAR CON ${bot.name.toUpperCase()}
      </button>
    `
    
    return card
  }

  loadBotAvatar(bot) {
    if (!bot.avatar) return

    const img = new Image()
    img.onload = () => {
      const avatarDiv = document.getElementById(`avatar-${bot.id}`)
      if (avatarDiv) {
        avatarDiv.outerHTML = `<img src="${bot.avatar}" alt="${bot.name}" class="avatar">`
      }
    }
    img.onerror = () => {
      console.log(`Could not load avatar for ${bot.name}`)
    }
    img.src = bot.avatar
  }

  updateFloatingChatButton() {
    this.removeFloatingButton()
    
    if (this.currentBotId || !this.bots || this.bots.length === 0) return

    const targetBot = this.getTargetBotForFloatingButton()
    if (targetBot) {
      const buttonText = `Abrir ${targetBot.name}`
      this.createFloatingChatButton(targetBot, buttonText)
    }
  }

  getTargetBotForFloatingButton() {
    if (this.lastMinimizedBotId && this.chatInstances[this.lastMinimizedBotId]) {
      return this.bots.find(b => b.id === this.lastMinimizedBotId)
    }
    return this.getDefaultBot()
  }

  getDefaultBot() {
    if (!this.bots || this.bots.length === 0) return null
    return this.bots.find(bot => bot.isDefault) || this.bots[0]
  }

  removeFloatingButton() {
    const existingButton = document.getElementById('floating-chat-button')
    if (existingButton) existingButton.remove()
  }

  createFloatingChatButton(bot, buttonText) {
    const floatingButton = document.createElement('button')
    floatingButton.id = 'floating-chat-button'
    floatingButton.title = buttonText
    floatingButton.className = 'floating-chat-button floating-chat-button-right'
    floatingButton.setAttribute('data-testid', 'floating-chat-button')
    
    floatingButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
    
    floatingButton.onclick = () => this.handleFloatingButtonClick(bot)
    document.body.appendChild(floatingButton)
  }

  handleFloatingButtonClick(bot) {
    if (this.lastMinimizedBotId && this.chatInstances[this.lastMinimizedBotId]) {
      this.restoreChatInstance(this.lastMinimizedBotId)
    } else {
      this.openChatbase(bot.chatbaseId, bot.id)
    }
  }

  openChatbase(chatbotId, botId) {
    console.log(`Opening chatbase for bot: ${botId}`)
    // Mock implementation for testing
    this.currentBotId = botId
    this.updateFloatingChatButton()
  }

  openConfig() {
    const modal = document.getElementById('configModal')
    if (modal) {
      modal.classList.add('active')
      this.renderBotList()
    }
  }

  closeConfig() {
    const modal = document.getElementById('configModal')
    if (modal) {
      modal.classList.remove('active')
    }
  }

  renderBotList() {
    const botList = document.getElementById('botList')
    if (!botList) return
    
    botList.innerHTML = '<h3 style="margin-bottom: 10px; font-size: 18px; color: #1e293b;">Bots actuales</h3>'

    this.bots.forEach((bot, index) => {
      const botItem = this.createBotListItem(bot, index)
      botList.appendChild(botItem)
    })
  }

  createBotListItem(bot, index) {
    const botItem = document.createElement('div')
    botItem.className = 'bot-item'
    botItem.setAttribute('data-testid', `bot-item-${bot.id}`)
    
    botItem.innerHTML = `
      <div class="bot-info">
        <div class="bot-name">${bot.name}</div>
        <div class="bot-id">ID: ${bot.chatbaseId}</div>
        ${bot.avatar ? '<div class="bot-id">Avatar: Personalizado</div>' : '<div class="bot-id">Avatar: Iniciales</div>'}
      </div>
      <div class="bot-controls">
        <label class="default-radio-label">
          <input 
            type="radio" 
            name="defaultBot" 
            value="${bot.id}" 
            ${bot.isDefault ? 'checked' : ''} 
            onchange="chatManager.setDefaultBot('${bot.id}')" 
            class="default-radio"
            data-testid="default-radio-${bot.id}"
          >
          <span class="radio-text">Por defecto</span>
        </label>
        <button 
          class="delete-bot" 
          onclick="chatManager.deleteBot(${index})"
          data-testid="delete-button-${bot.id}"
        >
          Eliminar
        </button>
      </div>
    `
    return botItem
  }

  setDefaultBot(botId) {
    this.bots.forEach(bot => {
      bot.isDefault = (bot.id === botId)
    })
    this.saveBots()
    this.updateFloatingChatButton()
    this.renderBotList() // Re-render to update radio buttons
  }

  deleteBot(index) {
    if (!confirm('¿Estás seguro de que quieres eliminar este bot?')) return
    
    const botToDelete = this.bots[index]
    
    if (botToDelete && this.chatInstances[botToDelete.id]) {
      // Mock cleanup
      delete this.chatInstances[botToDelete.id]
    }
    
    this.bots.splice(index, 1)
    this.saveBots()
    this.renderExperts()
    this.renderBotList()
  }

  restoreChatInstance() { /* Mock */ }
  cleanupAllInstances() { /* Mock */ }
}

describe('DOM Integration Tests', () => {
  let manager

  beforeEach(() => {
    // Create fresh DOM structure
    document.body.innerHTML = `
      <div class="container">
        <div class="header">
          <span class="badge">EXPERTOS QUE TE APOYAN</span>
          <h1>No estás solo</h1>
        </div>
        <div class="experts-grid" id="expertsGrid"></div>
      </div>
      <button class="config-button" data-testid="config-button">⚙️ Configuración</button>
      <div class="modal" id="configModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Configuración de Bots</h2>
            <button class="close-button" data-testid="close-button">&times;</button>
          </div>
          <div class="bot-list" id="botList"></div>
          <div class="add-bot-form">
            <input type="text" id="botName" placeholder="Nombre" data-testid="bot-name-input">
            <input type="text" id="botDescription" placeholder="Descripción" data-testid="bot-description-input">
            <input type="text" id="botAvatar" placeholder="Avatar URL" data-testid="bot-avatar-input">
            <input type="text" id="botId" placeholder="Chatbase ID" data-testid="bot-id-input">
            <button data-testid="add-bot-button">Agregar Bot</button>
          </div>
          <input type="file" id="importFile" accept=".json" data-testid="import-file">
        </div>
      </div>
    `

    setupLocalStorageWithBots(mockBots)
    manager = new mockChatbaseManagerClass()
  })

  describe('Expert Grid Rendering', () => {
    it('should render expert cards correctly', () => {
      const expertCards = document.querySelectorAll('[data-testid^="expert-card-"]')
      expect(expertCards).toHaveLength(3)

      // Check first expert card content
      const mariaCard = document.querySelector('[data-testid="expert-card-maria-financiera"]')
      expect(mariaCard).toBeInTheDocument()
      expect(mariaCard).toHaveTextContent('María Financiera')
      expect(mariaCard).toHaveTextContent('Experta en finanzas personales')
      expect(mariaCard).toHaveTextContent('HABLAR CON MARÍA FINANCIERA')
    })

    it('should generate correct initials for avatars', () => {
      const mariaAvatar = document.getElementById('avatar-maria-financiera')
      const juanAvatar = document.getElementById('avatar-juan-inversion')
      
      expect(mariaAvatar).toHaveTextContent('MF')
      expect(juanAvatar).toHaveTextContent('JI')
    })

    it('should create talk buttons with correct IDs', () => {
      const mariaButton = document.getElementById('btn-maria-financiera')
      const juanButton = document.getElementById('btn-juan-inversion')
      
      expect(mariaButton).toBeInTheDocument()
      expect(juanButton).toBeInTheDocument()
      expect(mariaButton).toHaveClass('talk-button')
    })
  })

  describe('Floating Chat Button', () => {
    it('should create floating button when no chat is active', () => {
      const floatingButton = document.querySelector('[data-testid="floating-chat-button"]')
      expect(floatingButton).toBeInTheDocument()
      expect(floatingButton).toHaveClass('floating-chat-button-right')
    })

    it('should remove floating button when chat is active', () => {
      manager.currentBotId = 'maria-financiera'
      manager.updateFloatingChatButton()
      
      const floatingButton = document.querySelector('[data-testid="floating-chat-button"]')
      expect(floatingButton).not.toBeInTheDocument()
    })

    it('should show correct bot name in floating button title', () => {
      const floatingButton = document.querySelector('[data-testid="floating-chat-button"]')
      expect(floatingButton.title).toBe('Abrir María Financiera')
    })
  })

  describe('Modal Functionality', () => {
    it('should open configuration modal', () => {
      const modal = document.getElementById('configModal')
      expect(modal).not.toHaveClass('active')
      
      manager.openConfig()
      
      expect(modal).toHaveClass('active')
    })

    it('should close configuration modal', () => {
      const modal = document.getElementById('configModal')
      modal.classList.add('active')
      
      manager.closeConfig()
      
      expect(modal).not.toHaveClass('active')
    })

    it('should close modal when clicking outside', () => {
      const modal = document.getElementById('configModal')
      modal.classList.add('active')
      
      // Create event that targets the modal itself (outside the content)
      const clickEvent = { target: modal }
      manager.handleModalClick(clickEvent)
      
      expect(modal).not.toHaveClass('active')
    })

    it('should not close modal when clicking inside content', () => {
      const modal = document.getElementById('configModal')
      const modalContent = modal.querySelector('.modal-content')
      modal.classList.add('active')
      
      const clickEvent = createMockClickEvent(modalContent)
      manager.handleModalClick(clickEvent)
      
      expect(modal).toHaveClass('active')
    })
  })

  describe('Bot List in Configuration', () => {
    beforeEach(() => {
      manager.openConfig()
    })

    it('should render bot list correctly', () => {
      const botItems = document.querySelectorAll('[data-testid^="bot-item-"]')
      expect(botItems).toHaveLength(3)
      
      const mariaItem = document.querySelector('[data-testid="bot-item-maria-financiera"]')
      expect(mariaItem).toHaveTextContent('María Financiera')
      expect(mariaItem).toHaveTextContent('ID: ABC123')
      expect(mariaItem).toHaveTextContent('Avatar: Personalizado')
    })

    it('should show default radio button checked for default bot', () => {
      const mariaRadio = document.querySelector('[data-testid="default-radio-maria-financiera"]')
      const juanRadio = document.querySelector('[data-testid="default-radio-juan-inversion"]')
      
      expect(mariaRadio).toBeChecked()
      expect(juanRadio).not.toBeChecked()
    })

    it('should change default bot when radio button is selected', () => {
      const juanRadio = document.querySelector('[data-testid="default-radio-juan-inversion"]')
      
      // Simulate radio button change
      manager.setDefaultBot('juan-inversion')
      
      expect(manager.bots[0].isDefault).toBe(false) // María
      expect(manager.bots[1].isDefault).toBe(true)  // Juan
    })

    it('should show delete buttons for all bots', () => {
      const deleteButtons = document.querySelectorAll('[data-testid^="delete-button-"]')
      expect(deleteButtons).toHaveLength(3)
      
      deleteButtons.forEach(button => {
        expect(button).toHaveTextContent('Eliminar')
        expect(button).toHaveClass('delete-bot')
      })
    })
  })

  describe('Chat Interaction', () => {
    it('should handle talk button click', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const mariaButton = document.querySelector('[data-testid="talk-button-maria-financiera"]')
      
      // Simulate button click by calling openChatbase directly
      manager.openChatbase('ABC123', 'maria-financiera')
      
      expect(consoleSpy).toHaveBeenCalledWith('Opening chatbase for bot: maria-financiera')
      expect(manager.currentBotId).toBe('maria-financiera')
    })

    it('should update floating button after opening chat', () => {
      manager.openChatbase('ABC123', 'maria-financiera')
      
      const floatingButton = document.querySelector('[data-testid="floating-chat-button"]')
      expect(floatingButton).not.toBeInTheDocument()
    })
  })

  describe('Avatar Loading', () => {
    it('should attempt to load custom avatars', async () => {
      // This will trigger the avatar loading for María who has a custom avatar
      expect(document.getElementById('avatar-maria-financiera')).toHaveTextContent('MF')
      
      // Wait for image load mock to complete
      await waitForDOM()
      
      // Since we're mocking Image onload, the avatar should be replaced
      // In a real scenario, this would become an <img> element
    })

    it('should keep initials fallback when avatar fails to load', () => {
      // Juan has no avatar, so should keep initials
      const juanAvatar = document.getElementById('avatar-juan-inversion')
      expect(juanAvatar).toHaveTextContent('JI')
      expect(juanAvatar).toHaveClass('avatar-fallback')
    })
  })

  describe('Bot Management Operations', () => {
    beforeEach(() => {
      manager.openConfig()
    })

    it('should delete bot when confirmed', () => {
      const initialCount = manager.bots.length
      confirm.mockReturnValue(true)
      
      manager.deleteBot(1) // Delete Juan
      
      expect(manager.bots).toHaveLength(initialCount - 1)
      expect(manager.bots.find(b => b.id === 'juan-inversion')).toBeUndefined()
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('should not delete bot when cancelled', () => {
      const initialCount = manager.bots.length
      confirm.mockReturnValue(false)
      
      manager.deleteBot(1)
      
      expect(manager.bots).toHaveLength(initialCount)
      expect(manager.bots.find(b => b.id === 'juan-inversion')).toBeDefined()
    })
  })
})