# fix-all

Repara TODOS los problemas del proyecto automáticamente.

## Uso
/fix-all [--commit]

## Template
Por favor, ejecuta una reparación completa del proyecto. Este comando es la versión agresiva que intenta reparar todo automáticamente.

### Scripts disponibles para testing:
- `pnpm test` - Ejecuta tests en modo watch
- `pnpm test:run` - Ejecuta tests una vez
- `pnpm test:coverage` - Ejecuta tests con reporte de coverage
- `pnpm test:ui` - Abre interfaz visual de Vitest
- `pnpm test [archivo]` - Ejecuta tests de un archivo específico

### 1. Limpieza profunda
```bash
# Limpieza completa
rm -rf .output node_modules/.cache .turbo
pnpm install
```

### 2. Reparación secuencial

<!-- pnpm lint:fix && pnpm test:coverage && pnpm build -->

#### Fase 1: Linting y Formateo
```bash
# Ejecuta linting con auto-fix
pnpm lint:fix

# Ejecuta formateo y linting completo
pnpm check
```
- Repara automáticamente problemas de estilo
- Continúa hasta que `pnpm lint` pase limpio

#### Fase 2: Tests - Análisis inicial
```bash
# Ver qué tests están fallando
pnpm test:run

# Si hay muchos fallos, ejecuta por archivo
pnpm test test/BotManagement.test.js
pnpm test test/ChatbaseManager.test.js
pnpm test test/DOMIntegration.test.js
pnpm test test/EdgeCases.test.js
```
- Identifica patrones de fallos
- Repara tests por categoría

#### Fase 3: Tests - Coverage completo
```bash
# Ejecuta tests con coverage
pnpm test:coverage

# Si necesitas más detalle visual
pnpm test:ui
```
- Asegura coverage mínimo de 90%
- Repara todos los tests que fallen

#### Fase 4: Validación CI
```bash
# Verifica que todo esté listo para CI
pnpm ci:check
```
- Asegura que no haya errores de formato o lint

#### Fase 5: Build
```bash
pnpm build
```
- Verifica que el build de producción sea exitoso

#### Fase 6: Optimizaciones y Refactoring
- Elimina imports no usados
- Ordena imports según convención
- Reemplaza console.* con el Logger class (solo permitido en src/logger.js)
- Convierte todas las funciones declaradas con `function` a arrow functions
- Reemplaza todos los `switch/case` con Object Literal Lookup
- Asegura que todas las variables usen `const` o `let` (no `var`)
- Optimiza imágenes si las hay

**Uso del Logger:**
```javascript
// Antes
console.log('Debug info')
console.error('Error occurred')

// Después
import logger from './logger.js'
logger.log('Debug info')    // Solo aparece en ENV=local o ENV=dev
logger.error('Error occurred')  // Siempre aparece
```

**Conversión de funciones:**
```javascript
// Antes
function myFunction(param) {
    return param * 2
}

// Después
const myFunction = (param) => {
    return param * 2
}
```

**Conversión de switch/case:**
```javascript
// Antes
switch(action) {
    case 'add':
        return a + b
    case 'subtract':
        return a - b
    default:
        return 0
}

// Después
const operations = {
    add: () => a + b,
    subtract: () => a - b
}
return operations[action]?.() || 0
```

### 3. Validación final completa
```bash
# Ejecuta todos los comandos de validación
pnpm validate

# O si necesitas auto-fix durante la validación
pnpm validate:fix
```

### 4. Si se especificó --commit y todo pasa:
```bash
git add -A
git commit -m "fix: comprehensive project fixes

- Resolved all ESLint violations
- Fixed all TypeScript errors  
- Repaired failing tests
- Improved test coverage to ${coverage}%
- Optimized imports and formatting
- Verified production build

Co-authored-by: Claude <claude@anthropic.com>"

git status
```

### 5. Reporte detallado

```markdown
🔧 PROJECT FIX-ALL REPORT
========================

## Cambios Realizados

### Linting (X archivos)
- Errores corregidos: Y
- Warnings resueltos: Z

### TypeScript (A archivos)
- Tipos agregados: B
- Interfaces creadas: C
- Errores resueltos: D

### Tests (E archivos)
- Tests reparados: F
- Tests agregados: G
- Coverage: antes H% → después I%

### Optimizaciones
- Imports optimizados: J archivos
- Código formateado: K archivos
- Bundle size: antes LKB → después MKB

## Estado Final
✅ Linting: PASS
✅ TypeScript: PASS
✅ Tests: PASS (coverage: N%)
✅ Build: PASS

## Tiempo Total: X minutos

## Recomendaciones
[Sugerencias para mantener la calidad]
```

### 6. Si algo no se puede reparar automáticamente:
- Crea un archivo `FIX_REQUIRED.md` con instrucciones manuales
- Lista exactamente qué necesita intervención humana
- Proporciona contexto y sugerencias
