# Pre-commit Hooks Configuration

Este proyecto utiliza **pre-commit hooks** para asegurar la calidad del código antes de cada commit.

## 🛠️ Herramientas Utilizadas

- **Husky v9**: Gestiona los Git hooks
- **lint-staged**: Ejecuta linters solo en archivos staged
- **Biome.js**: Linter y formatter rápido y moderno

## 📋 ¿Qué hace el pre-commit?

Antes de cada commit, automáticamente:

1. **Formatea** el código con Biome
2. **Verifica** errores de linting
3. **Bloquea** el commit si hay errores

## 🚀 Configuración

### Archivos Procesados

- `*.{js,jsx,ts,tsx}`: JavaScript/TypeScript
  - Se aplica formato automático
  - Se ejecuta linter con correcciones automáticas
  
- `*.{json,css,md,html}`: Otros archivos
  - Solo se aplica formato automático

### Saltar el Pre-commit (Emergencias)

Si necesitas hacer commit sin ejecutar los hooks:

```bash
git commit -m "mensaje" --no-verify
```

⚠️ **Usa con precaución**: Solo en casos de emergencia.

## 🔧 Comandos Útiles

```bash
# Verificar manualmente todos los archivos
pnpm check

# Solo formatear
pnpm format

# Solo linting
pnpm lint

# Linting con correcciones
pnpm lint:fix
```

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