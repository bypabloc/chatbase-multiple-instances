/**
 * Tests for bot management functionality including add, edit, import, export
 */

import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockFile, invalidBots, mockBots, setupLocalStorageWithBots } from './helpers.js'

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

// Extended ChatbaseManager with full bot management functionality
const mockChatbaseManagerClass = class ChatbaseManager {
    constructor() {
        this.bots = []
        this.chatInstances = {}
        this.currentBotId = null
        this.lastMinimizedBotId = null
        this.isTransitioning = false
    }

    loadBots() {
        try {
            const savedBots = localStorage.getItem('chatbaseBots')
            this.bots = savedBots ? JSON.parse(savedBots) : []
        } catch (error) {
            console.error('Error loading bots:', error)
            this.bots = []
        }
    }

    saveBots() {
        localStorage.setItem('chatbaseBots', JSON.stringify(this.bots))
    }

    getFormData() {
        return {
            name: document.getElementById('botName')?.value.trim() || '',
            description: document.getElementById('botDescription')?.value.trim() || '',
            avatar: document.getElementById('botAvatar')?.value.trim() || '',
            chatbaseId: document.getElementById('botId')?.value.trim() || '',
        }
    }

    validateBotForm(formData) {
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

        if (errors.length > 0) {
            alert(errors.join('\n'))
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
            isDefault: false,
        }
    }

    clearBotForm() {
        const fields = ['botName', 'botDescription', 'botAvatar', 'botId']
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId)
            if (field) field.value = ''
        })
    }

    addBot() {
        const formData = this.getFormData()

        if (!this.validateBotForm(formData)) return

        const newBot = this.createBotFromForm(formData)

        this.bots.push(newBot)
        this.saveBots()
        this.clearBotForm()

        return newBot
    }

    deleteBot(index) {
        if (!confirm('¿Estás seguro de que quieres eliminar este bot?')) return false

        const botToDelete = this.bots[index]

        if (botToDelete && this.chatInstances[botToDelete.id]) {
            // Mock cleanup
            delete this.chatInstances[botToDelete.id]
        }

        this.bots.splice(index, 1)
        this.saveBots()

        return true
    }

    setDefaultBot(botId) {
        this.bots.forEach(bot => {
            bot.isDefault = bot.id === botId
        })
        this.saveBots()
    }

    clearAllBots() {
        if (
            !confirm(
                '¿Estás seguro de que quieres eliminar todos los bots? Esta acción no se puede deshacer.'
            )
        ) {
            return false
        }

        try {
            this.bots = []
            this.saveBots()
            console.log('All bots deleted')
            return true
        } catch (error) {
            console.error('Error deleting bots:', error)
            return false
        }
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

        const requiredFields = ['id', 'name', 'description', 'chatbaseId', 'avatar', 'isDefault']

        for (const bot of importedData) {
            if (!bot || typeof bot !== 'object') {
                alert('Cada elemento debe ser un objeto válido')
                return false
            }

            for (const field of requiredFields) {
                if (!(field in bot)) {
                    alert(`El campo '${field}' es requerido en todos los bots`)
                    return false
                }
            }

            if (typeof bot.isDefault !== 'boolean') {
                alert('El campo isDefault debe ser true o false')
                return false
            }
        }

        return true
    }

    executeImport(importedData) {
        this.bots = importedData
        this.saveBots()

        // Clear file input
        const fileInput = document.getElementById('importFile')
        if (fileInput) fileInput.value = ''

        alert(`Se importaron ${importedData.length} bot(s) correctamente`)
        console.log('Data imported successfully:', importedData)

        return true
    }

    processImportFile(e, _fileInput) {
        try {
            const importedData = JSON.parse(e.target.result)

            if (!this.validateImportData(importedData)) return false

            if (
                confirm(
                    `¿Estás seguro de que quieres importar ${importedData.length} bot(s)? Esto reemplazará la configuración actual.`
                )
            ) {
                return this.executeImport(importedData)
            }

            return false
        } catch (error) {
            console.error('Error importing file:', error)
            alert('Error al procesar el archivo JSON. Verifica que el formato sea válido.')
            return false
        }
    }

    importFromFile() {
        const fileInput = document.getElementById('importFile')
        const file = fileInput?.files[0]

        if (!this.validateImportFile(file)) return false

        const reader = new FileReader()
        reader.onload = e => this.processImportFile(e, fileInput)
        reader.readAsText(file)

        return true
    }

    exportBots() {
        if (this.bots.length === 0) {
            alert('No hay bots para exportar')
            return false
        }

        const dataStr = JSON.stringify(this.bots, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })

        const link = document.createElement('a')
        link.href = URL.createObjectURL(dataBlob)
        link.download = `chatbase-bots-${new Date().toISOString().split('T')[0]}.json`
        link.click()

        return true
    }

    getDuplicateBotNames() {
        const names = this.bots.map(bot => bot.name.toLowerCase())
        return names.filter((name, index) => names.indexOf(name) !== index)
    }

    getBotById(id) {
        return this.bots.find(bot => bot.id === id)
    }

    getBotByName(name) {
        return this.bots.find(bot => bot.name.toLowerCase() === name.toLowerCase())
    }

    getBotByChatbaseId(chatbaseId) {
        return this.bots.find(bot => bot.chatbaseId === chatbaseId)
    }

    updateBot(index, updatedBot) {
        if (index < 0 || index >= this.bots.length) {
            throw new Error('Invalid bot index')
        }

        this.bots[index] = { ...this.bots[index], ...updatedBot }
        this.saveBots()

        return this.bots[index]
    }
}

describe('Bot Management Functionality', () => {
    let manager
    let user

    beforeEach(async () => {
        user = userEvent.setup()

        // Create DOM structure
        document.body.innerHTML = `
      <div class="add-bot-form">
        <input type="text" id="botName" placeholder="Nombre" data-testid="bot-name-input">
        <input type="text" id="botDescription" placeholder="Descripción" data-testid="bot-description-input">
        <input type="text" id="botAvatar" placeholder="Avatar URL" data-testid="bot-avatar-input">
        <input type="text" id="botId" placeholder="Chatbase ID" data-testid="bot-id-input">
        <button id="addBotBtn" data-testid="add-bot-button">Agregar Bot</button>
      </div>
      <input type="file" id="importFile" accept=".json" data-testid="import-file">
      <button id="clearAllBtn" data-testid="clear-all-button">Eliminar todos</button>
    `

        manager = new mockChatbaseManagerClass()
        setupLocalStorageWithBots([])
    })

    describe('Adding Bots', () => {
        it('should add a new bot with complete data', async () => {
            await user.type(screen.getByTestId('bot-name-input'), 'Carlos Experto')
            await user.type(
                screen.getByTestId('bot-description-input'),
                'Especialista en inversiones'
            )
            await user.type(
                screen.getByTestId('bot-avatar-input'),
                'https://example.com/carlos.jpg'
            )
            await user.type(screen.getByTestId('bot-id-input'), 'CARLOS123')

            const newBot = manager.addBot()

            expect(newBot).toEqual({
                id: 'carlos-experto',
                name: 'Carlos Experto',
                description: 'Especialista en inversiones',
                chatbaseId: 'CARLOS123',
                avatar: 'https://example.com/carlos.jpg',
                isDefault: false,
            })

            expect(manager.bots).toHaveLength(1)
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'chatbaseBots',
                JSON.stringify([newBot])
            )
        })

        it('should add bot without avatar (null avatar)', async () => {
            await user.type(screen.getByTestId('bot-name-input'), 'María Simple')
            await user.type(screen.getByTestId('bot-description-input'), 'Asesora financiera')
            await user.type(screen.getByTestId('bot-id-input'), 'MARIA123')
            // Leave avatar empty

            const newBot = manager.addBot()

            expect(newBot.avatar).toBeNull()
            expect(newBot.name).toBe('María Simple')
        })

        it('should not add bot with missing required fields', async () => {
            await user.type(screen.getByTestId('bot-name-input'), 'Incomplete Bot')
            // Missing description and chatbaseId

            const result = manager.addBot()

            expect(result).toBeUndefined()
            expect(manager.bots).toHaveLength(0)
            expect(alert).toHaveBeenCalledWith(
                'La descripción es requerida\nEl ID de Chatbase es requerido'
            )
        })

        it('should generate correct bot ID from name', async () => {
            await user.type(screen.getByTestId('bot-name-input'), 'María José López')
            await user.type(screen.getByTestId('bot-description-input'), 'Test description')
            await user.type(screen.getByTestId('bot-id-input'), 'TEST123')

            const newBot = manager.addBot()

            expect(newBot.id).toBe('maría-josé-lópez')
        })

        it('should clear form after adding bot', async () => {
            await user.type(screen.getByTestId('bot-name-input'), 'Test Bot')
            await user.type(screen.getByTestId('bot-description-input'), 'Test Description')
            await user.type(screen.getByTestId('bot-id-input'), 'TEST123')

            manager.addBot()

            expect(screen.getByTestId('bot-name-input')).toHaveValue('')
            expect(screen.getByTestId('bot-description-input')).toHaveValue('')
            expect(screen.getByTestId('bot-id-input')).toHaveValue('')
        })
    })

    describe('Deleting Bots', () => {
        beforeEach(() => {
            manager.bots = [...mockBots]
        })

        it('should delete bot when confirmed', () => {
            confirm.mockReturnValue(true)
            const initialCount = manager.bots.length

            const result = manager.deleteBot(1) // Delete Juan

            expect(result).toBe(true)
            expect(manager.bots).toHaveLength(initialCount - 1)
            expect(manager.bots.find(b => b.id === 'juan-inversion')).toBeUndefined()
            expect(localStorage.setItem).toHaveBeenCalled()
        })

        it('should not delete bot when cancelled', () => {
            confirm.mockReturnValue(false)
            const initialCount = manager.bots.length

            const result = manager.deleteBot(1)

            expect(result).toBe(false)
            expect(manager.bots).toHaveLength(initialCount)
            expect(manager.bots.find(b => b.id === 'juan-inversion')).toBeDefined()
        })

        it('should cleanup chat instances when deleting bot', () => {
            manager.chatInstances['juan-inversion'] = { container: 'mock' }
            confirm.mockReturnValue(true)

            manager.deleteBot(1)

            expect(manager.chatInstances['juan-inversion']).toBeUndefined()
        })
    })

    describe('Setting Default Bot', () => {
        beforeEach(() => {
            manager.bots = [...mockBots]
            // Ensure María is initially default
            manager.bots[0].isDefault = true
            manager.bots[1].isDefault = false
            manager.bots[2].isDefault = false
        })

        it('should set correct bot as default', () => {
            manager.setDefaultBot('juan-inversion')

            expect(manager.bots[0].isDefault).toBe(false) // María
            expect(manager.bots[1].isDefault).toBe(true) // Juan
            expect(manager.bots[2].isDefault).toBe(false) // Ana

            expect(localStorage.setItem).toHaveBeenCalled()
        })

        it('should unset previous default when setting new one', () => {
            // Verify initial state - María should be default
            expect(manager.bots[0].isDefault).toBe(true)

            manager.setDefaultBot('ana-deudas')

            expect(manager.bots[0].isDefault).toBe(false) // María
            expect(manager.bots[1].isDefault).toBe(false) // Juan
            expect(manager.bots[2].isDefault).toBe(true) // Ana
        })
    })

    describe('Clearing All Bots', () => {
        beforeEach(() => {
            manager.bots = [...mockBots]
        })

        it('should clear all bots when confirmed', () => {
            confirm.mockReturnValue(true)

            const result = manager.clearAllBots()

            expect(result).toBe(true)
            expect(manager.bots).toHaveLength(0)
            expect(localStorage.setItem).toHaveBeenCalledWith('chatbaseBots', JSON.stringify([]))
            expect(console.log).toHaveBeenCalledWith('All bots deleted')
        })

        it('should not clear bots when cancelled', () => {
            confirm.mockReturnValue(false)
            const initialCount = manager.bots.length

            const result = manager.clearAllBots()

            expect(result).toBe(false)
            expect(manager.bots).toHaveLength(initialCount)
        })
    })

    describe('File Import', () => {
        it('should validate file selection', () => {
            const result = manager.validateImportFile(null)
            expect(result).toBe(false)
            expect(alert).toHaveBeenCalledWith('Por favor selecciona un archivo JSON')
        })

        it('should validate file extension', () => {
            const txtFile = createMockFile('content', 'test.txt', 'text/plain')
            const result = manager.validateImportFile(txtFile)
            expect(result).toBe(false)
            expect(alert).toHaveBeenCalledWith('El archivo debe ser de tipo JSON')
        })

        it('should accept valid JSON file', () => {
            const jsonFile = createMockFile('{}', 'test.json', 'application/json')
            const result = manager.validateImportFile(jsonFile)
            expect(result).toBe(true)
        })

        it('should process valid import data correctly', () => {
            const mockEvent = { target: { result: JSON.stringify(mockBots) } }
            const mockFileInput = { value: 'test.json' }
            confirm.mockReturnValue(true)

            const result = manager.processImportFile(mockEvent, mockFileInput)

            expect(result).toBe(true)
            expect(manager.bots).toEqual(mockBots)
            expect(alert).toHaveBeenCalledWith('Se importaron 3 bot(s) correctamente')
        })

        it('should reject invalid import data', () => {
            const mockEvent = { target: { result: JSON.stringify(invalidBots) } }
            const mockFileInput = { value: 'test.json' }

            const result = manager.processImportFile(mockEvent, mockFileInput)

            expect(result).toBe(false)
            expect(alert).toHaveBeenCalledWith("El campo 'name' es requerido en todos los bots")
        })

        it('should handle malformed JSON', () => {
            const mockEvent = { target: { result: 'invalid json' } }
            const mockFileInput = { value: 'test.json' }

            const result = manager.processImportFile(mockEvent, mockFileInput)

            expect(result).toBe(false)
            expect(alert).toHaveBeenCalledWith(
                'Error al procesar el archivo JSON. Verifica que el formato sea válido.'
            )
            expect(console.error).toHaveBeenCalledWith('Error importing file:', expect.any(Error))
        })

        it('should cancel import when user declines', () => {
            const mockEvent = { target: { result: JSON.stringify(mockBots) } }
            const mockFileInput = { value: 'test.json' }
            confirm.mockReturnValue(false)

            const result = manager.processImportFile(mockEvent, mockFileInput)

            expect(result).toBe(false)
            expect(manager.bots).not.toEqual(mockBots)
        })
    })

    describe('Bot Search and Utilities', () => {
        beforeEach(() => {
            manager.bots = [...mockBots]
        })

        it('should find bot by ID', () => {
            const bot = manager.getBotById('maria-financiera')
            expect(bot).toEqual(mockBots[0])

            const nonExistent = manager.getBotById('non-existent')
            expect(nonExistent).toBeUndefined()
        })

        it('should find bot by name (case insensitive)', () => {
            const bot = manager.getBotByName('MARÍA FINANCIERA')
            expect(bot).toEqual(mockBots[0])

            const bot2 = manager.getBotByName('maría financiera')
            expect(bot2).toEqual(mockBots[0])
        })

        it('should find bot by Chatbase ID', () => {
            const bot = manager.getBotByChatbaseId('ABC123')
            expect(bot).toEqual(mockBots[0])

            const nonExistent = manager.getBotByChatbaseId('NONEXISTENT')
            expect(nonExistent).toBeUndefined()
        })

        it('should detect duplicate bot names', () => {
            // Add duplicate name
            manager.bots.push({
                id: 'maria-duplicate',
                name: 'María Financiera', // Same name as first bot
                description: 'Duplicate',
                chatbaseId: 'DUP123',
                avatar: null,
                isDefault: false,
            })

            const duplicates = manager.getDuplicateBotNames()
            expect(duplicates).toContain('maría financiera')
        })

        it('should update existing bot', () => {
            const updatedData = {
                name: 'María Actualizada',
                description: 'Nueva descripción',
            }

            const updatedBot = manager.updateBot(0, updatedData)

            expect(updatedBot.name).toBe('María Actualizada')
            expect(updatedBot.description).toBe('Nueva descripción')
            expect(updatedBot.chatbaseId).toBe('ABC123') // Should keep original
            expect(localStorage.setItem).toHaveBeenCalled()
        })

        it('should throw error for invalid bot index', () => {
            expect(() => {
                manager.updateBot(99, { name: 'Test' })
            }).toThrow('Invalid bot index')

            expect(() => {
                manager.updateBot(-1, { name: 'Test' })
            }).toThrow('Invalid bot index')
        })
    })
})
