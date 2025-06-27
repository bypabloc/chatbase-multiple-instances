# Project Setup & Quality Tools

Este documento detalla toda la configuración de calidad y herramientas implementadas en el proyecto.

## 🛠️ Stack de Herramientas

### Code Quality
- **Biome.js v2.0.5** - Linter y formatter ultra-rápido (reemplaza ESLint + Prettier)
- **Husky v9.1.7** - Git hooks automatizados
- **lint-staged v16.1.2** - Ejecuta linters solo en archivos modificados

### Testing
- **Vitest v3.2.4** - Framework de testing moderno
- **@testing-library** - Utilities para testing de DOM
- **JSdom** - Simulación de navegador
- **Coverage v8** - Reportes de cobertura detallados

### Build & Development
- **Vite v7.0** - Build tool con HMR ultra-rápido
- **Node.js v22.14.0** - Versión LTS con soporte completo ES2024
- **pnpm v10.12.4** - Package manager eficiente

## 🔒 Git Hooks

### Pre-commit Hook
**Archivo**: `.husky/pre-commit`
**Se ejecuta**: Antes de cada commit

```bash
✅ Formatea código con Biome
✅ Corrige errores de linting automáticamente
✅ Bloquea commits con errores graves
```

### Pre-push Hook
**Archivo**: `.husky/pre-push`
**Se ejecuta**: Antes de cada push

```bash
🔄 Cambia automáticamente a Node.js v22.14.0
✅ Verifica calidad de código (biome ci)
✅ Ejecuta 202 tests con cobertura ≥90%
✅ Valida build de producción
✅ Bloquea push si algo falla
```

## 🚀 GitHub Actions

### Workflow: verify-pr.yml
**Se ejecuta en**:
- Pull requests hacia `dev`
- Pushes a cualquier rama excepto `dev`, `main`, `master`

**Verificaciones**:
1. ✅ Setup Node.js v22 + PNPM
2. ✅ Instalación con cache optimizado
3. ✅ Verificación de código con Biome CI
4. ✅ Tests con cobertura (umbral 90%)
5. ✅ Build de producción
6. ✅ Verificación de archivos sin commitear
7. ✅ Comentarios automáticos en PRs

### Dependabot
**Configuración**: `.github/dependabot.yml`
- Actualiza dependencias npm semanalmente
- Actualiza GitHub Actions semanalmente
- Crea PRs automáticos los lunes

## 📊 Métricas de Calidad

### Cobertura de Tests
```
File       | % Stmts | % Branch | % Funcs | % Lines |
-----------|---------|----------|---------|---------|
All files  |   93.41 |    90.33 |   80.72 |   93.41 |
```

**Umbrales configurados**:
- Lines: ≥90%
- Functions: ≥75% 
- Branches: ≥88%
- Statements: ≥90%

### Tests Ejecutados
- **Total**: 202 tests
- **Archivos**: 10 test files
- **Tiempo**: ~10 segundos
- **Cobertura**: HTML + JSON + Text reports

## ⚙️ Configuración Biome

**Archivo**: `biome.json`

```json
{
  "formatter": {
    "indentWidth": 4,
    "lineWidth": 100,
    "quoteStyle": "single"
  },
  "linter": {
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error"
      }
    }
  }
}
```

## 🔄 Flujo de Desarrollo

```
1. nvm use                    # Usar Node.js v22.14.0
2. git checkout -b feature/x  # Crear rama
3. Hacer cambios             
4. git add .                  # Pre-commit: format + lint
5. git commit                 # ✅ Commit si todo OK
6. git push                   # Pre-push: tests + build
7. Crear PR                   # GitHub Actions: CI/CD
8. Review + Merge             # ✅ Código de calidad en dev
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Servidor con HMR
pnpm build        # Build de producción
pnpm preview      # Preview del build

# Testing  
pnpm test         # Tests en watch mode
pnpm test:coverage # Tests + coverage
pnpm test:ui      # Vitest UI

# Code Quality
pnpm lint         # Solo linting
pnpm format       # Solo formatting
pnpm check        # Lint + format
pnpm ci:check     # CI mode (no fixes)
pnpm prepush      # Pre-push manual
```

## 🚨 Comandos de Emergencia

```bash
# Saltar pre-commit
git commit -m "hotfix" --no-verify

# Saltar pre-push  
git push --no-verify

# Reinstalar todo
pnpm pkg:reinstall
```

## 💡 Best Practices

### Para Desarrolladores
1. **Siempre** ejecutar `nvm use` antes de trabajar
2. **Commitear frecuentemente** para aprovechar pre-commit
3. **Ejecutar** `pnpm prepush` antes de hacer push
4. **Revisar** reportes de cobertura en `coverage/index.html`

### Para Reviewers
1. **Verificar** que CI/CD pase antes de aprobar
2. **Revisar** cobertura en PRs
3. **Validar** que no hay warnings en Actions
4. **Asegurar** que build funciona correctamente

## 🎯 Beneficios Logrados

- ✅ **0 warnings** de versión de Node.js
- ✅ **93%+ cobertura** de tests garantizada
- ✅ **Código consistente** con formato automático
- ✅ **CI/CD robusto** con GitHub Actions
- ✅ **Builds garantizados** antes de cada push
- ✅ **Calidad uniforme** en todo el proyecto
- ✅ **Debugging fácil** con herramientas modernas
- ✅ **Mantenimiento automatizado** con Dependabot

## 🔧 Configuraciones Especiales

### Node.js Version Management
- Archivo `.nvmrc` con v22.14.0
- Pre-scripts automáticos en package.json
- Hook pre-push con cambio automático de versión

### Cache Optimization
- PNPM store path cache en GitHub Actions
- Dependencias cacheadas por hash de lock file
- Build cache para assets optimizados

### Error Handling
- Mensajes claros en hooks
- Tips de resolución automáticos
- Logs detallados en CI/CD