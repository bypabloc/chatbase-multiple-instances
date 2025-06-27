# GitHub Configuration

Este directorio contiene la configuración de GitHub para el proyecto.

## 📁 Estructura

```
.github/
├── workflows/
│   ├── verify-pr.yml      # CI/CD para verificar PRs y pushes
│   └── act.md            # Documentación para testing local
├── pull_request_template.md  # Template para PRs
├── dependabot.yml        # Configuración de Dependabot
└── README.md            # Este archivo
```

## 🔄 Workflows

### verify-pr.yml

**Propósito**: Verificar la calidad del código antes de mergear a `dev`.

**Se ejecuta en**:
- Pull requests hacia `dev`
- Pushes a cualquier rama excepto `dev`, `main`, `master`

**Verificaciones**:
1. ✅ Instalación de dependencias (PNPM)
2. ✅ Calidad de código (Biome)
3. ✅ Tests con cobertura (≥90%)
4. ✅ Build de producción
5. ✅ Sin cambios no commiteados

## 📝 Pull Request Template

Plantilla estándar para todos los PRs con:
- Resumen de cambios
- Checklist de acciones post-merge
- Espacio para screenshots

## 🤖 Dependabot

Configurado para:
- Actualizar dependencias npm semanalmente
- Actualizar GitHub Actions semanalmente
- Crear PRs los lunes a las 9:00 AM

## 🧪 Testing Local con Act

Para probar los workflows localmente:

```bash
# Instalar act
brew install act  # macOS
# o ver act.md para otras plataformas

# Probar workflow
act push -W .github/workflows/verify-pr.yml
```

## 🔐 Secretos Requeridos

Actualmente no se requieren secretos especiales. El workflow usa el `GITHUB_TOKEN` automático.

## 📊 Métricas de Calidad

El proyecto mantiene:
- 📈 Cobertura de tests ≥90%
- ✨ Código formateado con Biome
- 🔍 Sin errores de linting
- 🏗️ Build exitoso garantizado

## 🚀 Flujo de Trabajo

1. Crear rama desde `dev`
2. Hacer cambios
3. Los pre-commit hooks verifican formato
4. Los pre-push hooks verifican tests
5. Crear PR hacia `dev`
6. GitHub Actions verifica todo
7. Si pasa, mergear y borrar rama

## 💡 Tips

- Usa `pnpm prepush` localmente antes de hacer push
- Si un workflow falla, revisa los logs en Actions
- Para debugging, usa Act localmente
- Mantén las dependencias actualizadas con Dependabot