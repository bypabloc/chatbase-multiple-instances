import '@testing-library/jest-dom'

// Mock uno.css import
vi.mock('uno.css', () => ({}))

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}

global.localStorage = localStorageMock

// Mock window.alert and window.confirm
global.alert = vi.fn()
global.confirm = vi.fn(() => true)

// Mock console methods as spies
global.console = {
    ...console,
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
}

// Mock Image constructor for avatar loading tests
global.Image = class {
    constructor() {
        setTimeout(() => {
            this.onload?.()
        }, 0)
    }
}

// Mock Vercel Analytics
vi.mock('@vercel/analytics', () => ({
    inject: vi.fn(),
}))

// Reset all mocks before each test
beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    document.body.innerHTML = ''

    // Create base HTML structure for tests
    document.body.innerHTML = `
    <div class="container">
      <div class="header">
        <span class="badge">EXPERTOS QUE TE APOYAN</span>
        <h1>No estás solo, ni tienes que resolverlo todo tú <span class="heart">💙</span></h1>
      </div>
      <div class="experts-grid" id="expertsGrid"></div>
    </div>
    <button class="config-button">⚙️ Configuración</button>
    <div class="modal" id="configModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Configuración de Bots</h2>
          <button class="close-button">&times;</button>
        </div>
        <div class="bot-list" id="botList"></div>
        <div class="add-bot-form">
          <input type="text" id="botName" placeholder="Nombre">
          <input type="text" id="botDescription" placeholder="Descripción">
          <input type="text" id="botAvatar" placeholder="Avatar URL">
          <input type="text" id="botId" placeholder="Chatbase ID">
        </div>
        <input type="file" id="importFile" accept=".json">
      </div>
    </div>
  `
})
