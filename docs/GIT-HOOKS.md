# Git Hooks Configuration

Este proyecto utiliza **Git hooks** para asegurar la calidad del código antes de cada commit y push.

## 🛠️ Herramientas Utilizadas

- **Husky v9**: Gestiona los Git hooks
- **lint-staged**: Ejecuta linters solo en archivos staged
- **Biome.js**: Linter y formatter rápido y moderno

## 📋 Hooks Configurados

### 🔸 Pre-commit

Antes de cada commit, automáticamente:

1. **Formatea** el código con Biome
2. **Verifica** errores de linting
3. **Bloquea** el commit si hay errores

### 🔸 Pre-push

Antes de cada push, automáticamente:

1. **Verifica** la calidad del código con `biome ci`
2. **Ejecuta** todos los tests
3. **Valida** la cobertura de código:
   - Lines: ≥90%
   - Functions: ≥75%
   - Branches: ≥88%
   - Statements: ≥90%
4. **Bloquea** el push si algo falla

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

## 🎯 Beneficios

- ✅ **Código consistente**: Mismo estilo en todo el proyecto
- ✅ **Menos errores**: Detecta problemas antes del commit
- ✅ **PR más limpios**: Sin cambios de formato innecesarios
- ✅ **Ahorro de tiempo**: No más revisiones de estilo manual