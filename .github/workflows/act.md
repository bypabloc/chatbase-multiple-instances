# Act - Testing GitHub Actions Locally

Act es una herramienta que permite ejecutar GitHub Actions localmente usando Docker.

## Instalación

```bash
# Linux x86_64
curl -L https://github.com/nektos/act/releases/download/v0.2.77/act_Linux_x86_64.tar.gz -o act.tar.gz
tar xzvf act.tar.gz
sudo mv act /usr/local/bin/
sudo chmod +x /usr/local/bin/act
rm act.tar.gz

# macOS (usando Homebrew)
brew install act

# Windows (usando Chocolatey)
choco install act-cli
```

## Verificar Instalación

```bash
act --version
```

## Uso Básico

### Ejecutar workflow por defecto

```bash
act
```

### Ejecutar evento push

```bash
act push
```

### Ejecutar evento pull_request

```bash
act pull_request
```

## Uso Avanzado para este Proyecto

### Ejecutar el workflow verify-pr.yml

```bash
# Simular push a una rama feature
act push -W .github/workflows/verify-pr.yml

# Simular pull request a dev
act pull_request -W .github/workflows/verify-pr.yml
```

### Ejecutar con secretos (si fuera necesario)

```bash
act push -W .github/workflows/verify-pr.yml -s GITHUB_TOKEN="tu-token-aqui"
```

### Ejecutar job específico

```bash
act push -j verify -W .github/workflows/verify-pr.yml
```

### Comando completo recomendado

```bash
# Para probar el workflow completo
act push --action-offline-mode -j verify -W .github/workflows/verify-pr.yml -s GITHUB_TOKEN=""
```

### Usar runner específico

```bash
# Ubuntu completo (más similar a GitHub Actions)
act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:full-latest
```

## Solución de Problemas

### Reconstruir imagen Docker

```bash
act push --rebuild
```

### Limpiar imágenes de Docker

```bash
# Eliminar todas las imágenes de act
docker rmi $(docker images 'catthehacker/ubuntu*' -q) -f
```

### Ver logs detallados

```bash
act push -v
```

## Ejemplo de Evento JSON

Crear archivo `event.json` para simular un push:

```json
{
  "ref": "refs/heads/feature/nueva-funcionalidad",
  "repository": {
    "name": "chatbase-multiple-instances",
    "owner": {
      "login": "bypabloc"
    }
  }
}
```

Ejecutar con el evento:

```bash
act push -e event.json -W .github/workflows/verify-pr.yml
```

## Tips para este Proyecto

1. **Primera vez**: Act descargará las imágenes de Docker necesarias (puede tardar)
2. **Cache**: Act no maneja el cache de PNPM como GitHub Actions
3. **Secretos**: Para este workflow no son necesarios secretos especiales
4. **Performance**: Es más lento que GitHub Actions real pero útil para debugging

## Verificaciones del Workflow

El workflow `verify-pr.yml` ejecuta:

1. ✓ Instalación de dependencias con PNPM
2. ✓ Verificación de código con Biome (`pnpm ci:check`)
3. ✓ Tests con cobertura (`pnpm test:coverage`)
4. ✓ Build de producción (`pnpm build`)
5. ✓ Verificación de archivos sin commitear

Si todas pasan, el código está listo para PR/merge.