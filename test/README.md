# Test Suite para Chatbase Manager

Esta suite de tests proporciona cobertura completa para la aplicación Chatbase Manager, incluyendo tests unitarios, de integración y edge cases.

## Estructura de Tests

### 📁 Archivos de Test

- **`ChatbaseManager.test.js`** - Tests unitarios para funciones básicas de la clase ChatbaseManager
- **`DOMIntegration.test.js`** - Tests de integración entre JavaScript y DOM
- **`BotManagement.test.js`** - Tests para funcionalidades de gestión de bots
- **`EdgeCases.test.js`** - Tests para casos límite y manejo de errores

### 📁 Archivos de Configuración

- **`setup.js`** - Configuración global de tests y mocks
- **`helpers.js`** - Utilidades y datos de prueba
- **`vitest.config.js`** - Configuración de Vitest

## Comandos de Test

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests en modo watch
pnpm test:watch

# Ejecutar tests con interfaz gráfica
pnpm test:ui

# Ejecutar tests una sola vez (para CI)
pnpm test:run

# Generar reporte de coverage
pnpm test:coverage
```

## Cobertura de Tests

### ✅ Tests Unitarios
- Inicialización de ChatbaseManager
- Gestión de localStorage
- Funciones de utilidad (getInitials, isMobile, etc.)
- Validaciones de datos
- Bot management (add, delete, set default)

### ✅ Tests de Integración
- Renderizado de tarjetas de expertos
- Funcionalidad del botón flotante
- Interacciones con modales
- Eventos de click y navegación
- Carga de avatares

### ✅ Tests de Edge Cases
- Manejo de DOM corrupto o faltante
- Prevención de XSS
- Errores de localStorage
- Instancias de chat huérfanas
- Límites de datos y memoria

## Datos de Prueba

Los tests utilizan datos mock definidos en `helpers.js`:

```javascript
const mockBots = [
  {
    id: 'maria-financiera',
    name: 'María Financiera',
    description: 'Experta en finanzas personales',
    chatbaseId: 'ABC123',
    avatar: 'https://example.com/maria.jpg',
    isDefault: true
  },
  // ... más bots
]
```

## Configuración del Entorno

### Mocks Globales
- `localStorage` - Mock completo con métodos getItem, setItem, etc.
- `window.alert` y `window.confirm` - Mocks para dialogs
- `console.log` y `console.error` - Spies para logging
- `Image` constructor - Mock para carga de avatares
- `@vercel/analytics` - Mock del módulo de analytics

### DOM Setup
Cada test recibe una estructura DOM limpia con elementos base:
- Container principal
- Grid de expertos
- Modal de configuración
- Formularios de bot

## Patrones de Test

### Testing de Componentes DOM
```javascript
it('should render expert cards correctly', () => {
  const expertCards = document.querySelectorAll('[data-testid^="expert-card-"]')
  expect(expertCards).toHaveLength(3)
  
  const mariaCard = document.querySelector('[data-testid="expert-card-maria-financiera"]')
  expect(mariaCard).toHaveTextContent('María Financiera')
})
```

### Testing de Estados
```javascript
it('should set default bot correctly', () => {
  manager.setDefaultBot('juan-inversion')
  
  expect(manager.bots[0].isDefault).toBe(false) // María
  expect(manager.bots[1].isDefault).toBe(true)  // Juan
  expect(localStorage.setItem).toHaveBeenCalled()
})
```

### Testing de Error Handling
```javascript
it('should handle localStorage errors gracefully', () => {
  localStorage.getItem.mockImplementation(() => {
    throw new Error('Storage error')
  })
  
  manager.loadBots()
  
  expect(manager.bots).toEqual([])
  expect(console.error).toHaveBeenCalledWith('Error loading bots:', expect.any(Error))
})
```

## Debugging Tests

### Ejecutar un test específico
```bash
pnpm test ChatbaseManager.test.js
```

### Ejecutar con output detallado
```bash
pnpm test --reporter=verbose
```

### Ver coverage en browser
```bash
pnpm test:coverage
# Abre coverage/index.html en el navegador
```

## Métricas de Calidad

Los tests están diseñados para mantener:
- **Cobertura de líneas**: >95%
- **Cobertura de funciones**: >95%
- **Cobertura de branches**: >90%
- **Cobertura de statements**: >95%

## Contribuir

Al agregar nuevas funcionalidades:

1. **Agregar tests unitarios** para lógica de negocio
2. **Agregar tests de integración** para interacciones DOM
3. **Considerar edge cases** y error handling
4. **Mantener coverage** por encima de 95%
5. **Usar data-testid** para elementos DOM que se testean

### Ejemplo de test para nueva funcionalidad:
```javascript
describe('Nueva Funcionalidad', () => {
  beforeEach(() => {
    // Setup específico
  })

  it('should handle happy path', () => {
    // Test del caso principal
  })

  it('should handle edge cases', () => {
    // Test de casos límite
  })

  it('should handle errors gracefully', () => {
    // Test de manejo de errores
  })
})
```