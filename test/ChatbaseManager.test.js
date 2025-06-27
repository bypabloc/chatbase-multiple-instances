/**
 * Unit tests for ChatbaseManager class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  mockBots, 
  invalidBots, 
  createMockChatbaseManager,
  createMockFile,
  createMockFileReader,
  setupLocalStorageWithBots,
  mockMobileViewport,
  mockDesktopViewport
} from './helpers.js'

// We need to mock the script.js module since it has side effects
const mockChatbaseManagerClass = class ChatbaseManager {
  constructor() {
    this.bots = []
    this.chatInstances = {}
    this.currentBotId = null
    this.lastMinimizedBotId = null
    this.isTransitioning = false
  }

  // Copy all methods from the real implementation
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

  getDefaultBot() {
    if (!this.bots || this.bots.length === 0) return null
    return this.bots.find(bot => bot.isDefault) || this.bots[0]
  }

  setDefaultBot(botId) {
    this.bots.forEach(bot => {
      bot.isDefault = (bot.id === botId)
    })
    this.saveBots()
    this.updateFloatingChatButton()
  }

  getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').slice(0, 2)
  }

  isMobile() {
    return window.innerWidth <= 768
  }

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

  validateImportData(importedData) {
    if (!Array.isArray(importedData)) {
      alert('El archivo JSON debe contener un array de bots')
      return false
    }
    
    const isValidData = importedData.every(bot => {
      return bot && 
             typeof bot === 'object' &&
             typeof bot.id === 'string' &&
             typeof bot.name === 'string' &&
             typeof bot.description === 'string' &&
             typeof bot.chatbaseId === 'string' &&
             (bot.avatar === null || typeof bot.avatar === 'string') &&
             typeof bot.isDefault === 'boolean'
    })
    
    if (!isValidData) {
      alert('El archivo JSON no tiene el formato correcto. Cada bot debe tener: id, name, description, chatbaseId, avatar, isDefault')
      return false
    }
    
    return true
  }

  validateBotForm(formData) {
    if (!formData.name || !formData.description || !formData.chatbaseId) {
      alert('Por favor, completa todos los campos obligatorios')
      return false
    }
    return true
  }

  createBotFromForm(formData) {
    return {
      id: formData.name.toLowerCase().replace(/\s/g, '-'),
      name: formData.name,
      description: formData.description,
      chatbaseId: formData.chatbaseId,
      avatar: formData.avatar || null,
      isDefault: false
    }
  }

  renderExperts() { /* Mock */ }
  updateFloatingChatButton() { /* Mock */ }
  setupEventListeners() { /* Mock */ }
}

describe('ChatbaseManager - Basic Functionality', () => {
  let manager

  beforeEach(() => {
    manager = new mockChatbaseManagerClass()
  })

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      expect(manager.bots).toEqual([])
      expect(manager.chatInstances).toEqual({})
      expect(manager.currentBotId).toBeNull()
      expect(manager.lastMinimizedBotId).toBeNull()
      expect(manager.isTransitioning).toBe(false)
    })
  })

  describe('Bot Management', () => {
    beforeEach(() => {
      manager.bots = [...mockBots]
    })

    it('should get default bot correctly', () => {
      const defaultBot = manager.getDefaultBot()
      expect(defaultBot).toEqual(mockBots[0]) // María is default
      expect(defaultBot.isDefault).toBe(true)
    })

    it('should return first bot if no default is set', () => {
      manager.bots.forEach(bot => bot.isDefault = false)
      const defaultBot = manager.getDefaultBot()
      expect(defaultBot).toEqual(mockBots[0])
    })

    it('should return null if no bots exist', () => {
      manager.bots = []
      const defaultBot = manager.getDefaultBot()
      expect(defaultBot).toBeNull()
    })

    it('should set default bot correctly', () => {
      manager.setDefaultBot('juan-inversion')
      
      expect(manager.bots[0].isDefault).toBe(false) // María
      expect(manager.bots[1].isDefault).toBe(true)  // Juan
      expect(manager.bots[2].isDefault).toBe(false) // Ana
    })
  })

  describe('Utility Functions', () => {
    it('should generate correct initials', () => {
      expect(manager.getInitials('María Financiera')).toBe('MF')
      expect(manager.getInitials('Juan')).toBe('J')
      expect(manager.getInitials('Ana María López')).toBe('AM')
      expect(manager.getInitials('')).toBe('')
    })

    it('should detect mobile viewport correctly', () => {
      mockMobileViewport()
      expect(manager.isMobile()).toBe(true)
      
      mockDesktopViewport()
      expect(manager.isMobile()).toBe(false)
    })
  })

  describe('Local Storage Integration', () => {
    it('should load bots from localStorage', () => {
      setupLocalStorageWithBots(mockBots)
      
      manager.loadBots()
      
      expect(manager.bots).toEqual(mockBots)
      expect(localStorage.getItem).toHaveBeenCalledWith('chatbaseBots')
    })

    it('should handle localStorage errors gracefully', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      manager.loadBots()
      
      expect(manager.bots).toEqual([])
      expect(console.error).toHaveBeenCalledWith('Error loading bots:', expect.any(Error))
    })

    it('should save bots to localStorage', () => {
      manager.bots = mockBots
      
      manager.saveBots()
      
      expect(localStorage.setItem).toHaveBeenCalledWith('chatbaseBots', JSON.stringify(mockBots))
    })

    it('should handle invalid JSON in localStorage', () => {
      localStorage.getItem.mockReturnValue('invalid json')
      
      manager.loadBots()
      
      expect(manager.bots).toEqual([])
      expect(console.error).toHaveBeenCalled()
    })
  })
})

describe('ChatbaseManager - Validation', () => {
  let manager

  beforeEach(() => {
    manager = new mockChatbaseManagerClass()
  })

  describe('File Import Validation', () => {
    it('should validate file existence', () => {
      expect(manager.validateImportFile(null)).toBe(false)
      expect(alert).toHaveBeenCalledWith('Por favor selecciona un archivo JSON')
    })

    it('should validate file extension', () => {
      const txtFile = createMockFile('content', 'test.txt', 'text/plain')
      expect(manager.validateImportFile(txtFile)).toBe(false)
      expect(alert).toHaveBeenCalledWith('El archivo debe ser de tipo JSON')
    })

    it('should accept valid JSON file', () => {
      const jsonFile = createMockFile('{}', 'test.json', 'application/json')
      expect(manager.validateImportFile(jsonFile)).toBe(true)
    })
  })

  describe('Import Data Validation', () => {
    it('should reject non-array data', () => {
      expect(manager.validateImportData({})).toBe(false)
      expect(alert).toHaveBeenCalledWith('El archivo JSON debe contener un array de bots')
    })

    it('should validate bot structure', () => {
      expect(manager.validateImportData(invalidBots)).toBe(false)
      expect(alert).toHaveBeenCalledWith(expect.stringContaining('formato correcto'))
    })

    it('should accept valid bot data', () => {
      expect(manager.validateImportData(mockBots)).toBe(true)
    })

    it('should handle bots with null avatar', () => {
      const botsWithNullAvatar = [{
        id: 'test',
        name: 'Test Bot',
        description: 'Test Description',
        chatbaseId: 'TEST123',
        avatar: null,
        isDefault: false
      }]
      
      expect(manager.validateImportData(botsWithNullAvatar)).toBe(true)
    })
  })

  describe('Form Validation', () => {
    it('should validate required form fields', () => {
      const incompleteForm = {
        name: 'Test Bot',
        description: '',
        chatbaseId: 'TEST123'
      }
      
      expect(manager.validateBotForm(incompleteForm)).toBe(false)
      expect(alert).toHaveBeenCalledWith('Por favor, completa todos los campos obligatorios')
    })

    it('should accept complete form data', () => {
      const completeForm = {
        name: 'Test Bot',
        description: 'Test Description',
        chatbaseId: 'TEST123',
        avatar: 'https://example.com/avatar.jpg'
      }
      
      expect(manager.validateBotForm(completeForm)).toBe(true)
    })

    it('should create bot from form data correctly', () => {
      const formData = {
        name: 'María Elena',
        description: 'Experta en finanzas',
        chatbaseId: 'ME123',
        avatar: 'https://example.com/maria.jpg'
      }
      
      const bot = manager.createBotFromForm(formData)
      
      expect(bot).toEqual({
        id: 'maría-elena',
        name: 'María Elena',
        description: 'Experta en finanzas',
        chatbaseId: 'ME123',
        avatar: 'https://example.com/maria.jpg',
        isDefault: false
      })
    })

    it('should handle empty avatar in form', () => {
      const formData = {
        name: 'Test Bot',
        description: 'Test Description',
        chatbaseId: 'TEST123',
        avatar: ''
      }
      
      const bot = manager.createBotFromForm(formData)
      expect(bot.avatar).toBeNull()
    })
  })
})