/**
 * Ultimate coverage test to reach 95% by targeting specific remaining lines
 * Lines 1085, 1097-1108, 1130-1132
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock @vercel/analytics
vi.mock('@vercel/analytics', () => ({
  inject: vi.fn()
}))

describe('Ultimate Coverage - Final Push to 95%', () => {
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

  describe('SetDefaultBot Function - Line 1085', () => {
    it('should set default bot and trigger radio button change', () => {
      // Setup bots
      chatManager.bots = [
        {
          id: 'bot1',
          name: 'Bot 1',
          description: 'First bot',
          chatbaseId: 'BOT1',
          avatar: null,
          isDefault: false
        },
        {
          id: 'bot2',
          name: 'Bot 2',
          description: 'Second bot',
          chatbaseId: 'BOT2',
          avatar: null,
          isDefault: true
        }
      ]

      // Call setDefaultBot to cover line 1085 path
      chatManager.setDefaultBot('bot1')

      // Verify the default was changed
      expect(chatManager.bots[0].isDefault).toBe(true)
      expect(chatManager.bots[1].isDefault).toBe(false)
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('should handle setDefaultBot directly', () => {
      // Setup bots
      chatManager.bots = [
        { id: 'bot1', name: 'Bot 1', isDefault: false },
        { id: 'bot2', name: 'Bot 2', isDefault: true }
      ]

      // Call setDefaultBot directly to cover the function
      chatManager.setDefaultBot('bot1')

      // Verify the change was processed
      expect(chatManager.bots[0].isDefault).toBe(true)
      expect(chatManager.bots[1].isDefault).toBe(false)
      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('AddBot Function - Lines 1097-1108', () => {
    it('should add bot with complete valid form data', () => {
      // Setup form with valid data
      document.getElementById('botName').value = 'New Bot'
      document.getElementById('botDescription').value = 'New bot description'
      document.getElementById('botAvatar').value = 'https://example.com/avatar.jpg'
      document.getElementById('botId').value = 'NEWBOT123'

      const initialBotCount = chatManager.bots.length

      // Call addBot to cover lines 1097-1108
      chatManager.addBot()

      // Verify bot was added
      expect(chatManager.bots).toHaveLength(initialBotCount + 1)
      
      const newBot = chatManager.bots[chatManager.bots.length - 1]
      expect(newBot.name).toBe('New Bot')
      expect(newBot.description).toBe('New bot description')
      expect(newBot.avatar).toBe('https://example.com/avatar.jpg')
      expect(newBot.chatbaseId).toBe('NEWBOT123')

      // Verify form was cleared
      expect(document.getElementById('botName').value).toBe('')
      expect(document.getElementById('botDescription').value).toBe('')
      expect(document.getElementById('botAvatar').value).toBe('')
      expect(document.getElementById('botId').value).toBe('')

      // Verify storage was updated
      expect(localStorage.setItem).toHaveBeenCalledWith('chatbaseBots', JSON.stringify(chatManager.bots))
    })

    it('should not add bot if validation fails', () => {
      // Setup form with invalid data (missing required fields)
      document.getElementById('botName').value = ''
      document.getElementById('botDescription').value = 'Description'
      document.getElementById('botId').value = 'BOT123'

      global.alert = vi.fn()
      const initialBotCount = chatManager.bots.length

      // Call addBot - should fail validation and return early
      chatManager.addBot()

      // Verify bot was NOT added
      expect(chatManager.bots).toHaveLength(initialBotCount)
      expect(global.alert).toHaveBeenCalledWith('Por favor, completa todos los campos obligatorios')
    })
  })

  describe('ValidateBotForm Function - Lines 1130-1132', () => {
    it('should validate form with missing name', () => {
      global.alert = vi.fn()
      
      const formData = {
        name: '',
        description: 'Valid description',
        chatbaseId: 'VALID123',
        avatar: null
      }

      const isValid = chatManager.validateBotForm(formData)

      expect(isValid).toBe(false)
      expect(global.alert).toHaveBeenCalledWith('Por favor, completa todos los campos obligatorios')
    })

    it('should validate form with missing description', () => {
      global.alert = vi.fn()
      
      const formData = {
        name: 'Valid name',
        description: '',
        chatbaseId: 'VALID123',
        avatar: null
      }

      const isValid = chatManager.validateBotForm(formData)

      expect(isValid).toBe(false)
      expect(global.alert).toHaveBeenCalledWith('Por favor, completa todos los campos obligatorios')
    })

    it('should validate form with missing chatbaseId', () => {
      global.alert = vi.fn()
      
      const formData = {
        name: 'Valid name',
        description: 'Valid description',
        chatbaseId: '',
        avatar: null
      }

      const isValid = chatManager.validateBotForm(formData)

      expect(isValid).toBe(false)
      expect(global.alert).toHaveBeenCalledWith('Por favor, completa todos los campos obligatorios')
    })

    it('should validate form with all required fields present', () => {
      const formData = {
        name: 'Valid name',
        description: 'Valid description',
        chatbaseId: 'VALID123',
        avatar: null
      }

      const isValid = chatManager.validateBotForm(formData)

      expect(isValid).toBe(true)
    })
  })

  describe('Edge Cases for Remaining Coverage', () => {
    it('should handle createBotFromForm with all possible avatar scenarios', () => {
      // Test with null avatar
      const formData1 = {
        name: 'Test Bot',
        description: 'Test Description',
        chatbaseId: 'TEST123',
        avatar: ''
      }

      const bot1 = chatManager.createBotFromForm(formData1)
      expect(bot1.avatar).toBeNull()

      // Test with valid avatar URL
      const formData2 = {
        name: 'Test Bot 2',
        description: 'Test Description 2',
        chatbaseId: 'TEST456',
        avatar: 'https://example.com/avatar.jpg'
      }

      const bot2 = chatManager.createBotFromForm(formData2)
      expect(bot2.avatar).toBe('https://example.com/avatar.jpg')
    })

    it('should cover any remaining createBotListItem paths', () => {
      const bot = {
        id: 'test-bot',
        name: 'Test Bot',
        description: 'Test Description',
        chatbaseId: 'TEST123',
        avatar: null,
        isDefault: true
      }

      const item = chatManager.createBotListItem(bot, 0)
      
      // Verify the item was created with all expected content
      expect(item.innerHTML).toContain('Test Bot')
      expect(item.innerHTML).toContain('TEST123')
      expect(item.innerHTML).toContain('checked')
      expect(item.innerHTML).toContain('Por defecto')
      expect(item.innerHTML).toContain('Eliminar')
    })

    it('should handle complete form workflow', () => {
      // Fill form
      document.getElementById('botName').value = 'Workflow Bot'
      document.getElementById('botDescription').value = 'Complete workflow test'
      document.getElementById('botAvatar').value = ''
      document.getElementById('botId').value = 'WORKFLOW123'

      // Get form data
      const formData = chatManager.getFormData()
      expect(formData.name).toBe('Workflow Bot')

      // Validate form
      const isValid = chatManager.validateBotForm(formData)
      expect(isValid).toBe(true)

      // Create bot
      const newBot = chatManager.createBotFromForm(formData)
      expect(newBot.id).toBe('workflow-bot')
      expect(newBot.name).toBe('Workflow Bot')
      expect(newBot.avatar).toBeNull()

      // Add to collection
      chatManager.bots.push(newBot)
      expect(chatManager.bots.some(bot => bot.id === 'workflow-bot')).toBe(true)
    })
  })
})