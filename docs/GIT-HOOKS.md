# Git Hooks Configuration

Este proyecto utiliza **Git hooks** para asegurar la calidad del código antes de cada commit y push.

## 🛠️ Herramientas Utilizadas

- **Husky v9**: Gestiona los Git hooks
- **lint-staged**: Ejecuta linters solo en archivos staged
- **Biome.js**: Linter y formatter rápido y moderno

## 📋 Hooks Configurados

### 🔸 Pre-commit

Antes de cada commit, automáticamente:

1. **Protección de Ramas**: Bloquea commits directos a `dev`, `main`, `master`
   - **dev**: Para desarrollo activo (requiere PR)
   - **master**: Solo para releases de producción (requiere PR desde dev)
2. **Formatea** el código con Biome
3. **Verifica** errores de linting
4. **Bloquea** el commit si hay errores

### 🔸 Pre-push

Antes de cada push, automáticamente:

1. **Verifica** la versión de Node.js (debe ser v22.14.0)
2. **Verifica** la calidad del código con `biome ci`
3. **Ejecuta** todos los tests
4. **Valida** la cobertura de código:
   - Lines: ≥90%
   - Functions: ≥75%
   - Branches: ≥88%
   - Statements: ≥90%
5. **Bloquea** el push si algo falla

## 🚀 Configuración

### Archivos Procesados

- `*.{js,jsx,ts,tsx}`: JavaScript/TypeScript
  - Se aplica formato automático
  - Se ejecuta linter con correcciones automáticas
  
- `*.{json,css,md,html}`: Otros archivos
  - Solo se aplica formato automático

### Saltar los Hooks (Emergencias)

Si necesitas hacer commit o push sin ejecutar los hooks:

```bash
# Saltar pre-commit
git commit -m "mensaje" --no-verify

# Saltar pre-push
git push --no-verify
```

⚠️ **Usa con precaución**: Solo en casos de emergencia.

## 🔧 Comandos Útiles

```bash
# ⚠️ IMPORTANTE: Usar siempre la versión correcta de Node.js
nvm use

# Verificar manualmente todos los archivos
pnpm check

# Solo formatear
pnpm format

# Solo linting
pnpm lint

# Linting con correcciones
pnpm lint:fix

# Ejecutar verificaciones pre-push manualmente
pnpm prepush

# Ver cobertura de tests
pnpm test:coverage
```

⚠️ **Nota Importante**: Siempre ejecuta `nvm use` antes de usar comandos con pnpm para asegurar que uses Node.js v22.14.0 y evitar warnings de versión.

## 📝 Ejemplo de Uso

1. Haces cambios en tu código
2. `git add .`
3. `git commit -m "feat: nueva funcionalidad"`
4. El pre-commit se ejecuta automáticamente:
   - ✅ Si todo está bien: El commit se completa
   - ❌ Si hay errores: El commit se cancela y se muestran los errores

## 🐛 Solución de Problemas

### El pre-commit no se ejecuta

```bash
# Reinstalar husky
pnpm run prepare
```

### Errores de formato persistentes

```bash
# Formatear todo el proyecto
pnpm format
pnpm lint:fix
```

### Conflictos con lint-staged

Si ves errores de "merge conflict", ejecuta:

```bash
git stash
git commit --no-verify
git stash pop
```

## 🌳 Estrategia de Branching

### Ramas Protegidas

#### 🔒 `master` - Producción
- **Propósito**: Releases estables para producción
- **Protección**: Solo merges desde `dev` via PR
- **Acceso**: Solo release managers
- **Workflow**: `dev` → PR → `master`

#### 🔒 `dev` - Desarrollo
- **Propósito**: Integración de features
- **Protección**: Solo merges desde feature branches via PR  
- **Workflow**: `feature/*` → PR → `dev`

#### ✅ `feature/*` - Features
- **Propósito**: Desarrollo de funcionalidades
- **Ejemplo**: `feature/user-auth`, `feature/payment-gateway`
- **Workflow**: Libre desarrollo con commits directos

### Flujo Completo de Release
```bash
# 1. Desarrollo
feature/new-feature → (PR) → dev

# 2. Testing en dev
# Verificaciones automáticas, QA manual

# 3. Release a producción  
dev → (PR) → master → deploy
```

## 🎯 Beneficios

- ✅ **Código consistente**: Mismo estilo en todo el proyecto
- ✅ **Menos errores**: Detecta problemas antes del commit
- ✅ **PR más limpios**: Sin cambios de formato innecesarios
- ✅ **Ahorro de tiempo**: No más revisiones de estilo manual
- ✅ **Release controlado**: Master solo contiene código probado
- ✅ **Historial limpio**: Commits organizados por features
- ✅ **Rollback seguro**: Fácil reversión de cambios problemáticos