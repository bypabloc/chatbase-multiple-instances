# PR Template Generator

Genera un título sugerido y template para Pull Request comparando la rama actual contra dev (o ramas especificadas).

## Uso

```bash
# Comparar rama actual con dev
claude pr-template

# Especificar ramas manualmente
claude pr-template --base dev --head feature/nueva-funcionalidad
```

## Argumentos

- `--base <rama>`: Rama base (por defecto: dev)
- `--head <rama>`: Rama de comparación (por defecto: rama actual)

## Implementación

```bash
#!/bin/bash

# Valores por defecto
BASE_BRANCH="dev"
HEAD_BRANCH=$(git branch --show-current)

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --base)
            BASE_BRANCH="$2"
            shift 2
            ;;
        --head)
            HEAD_BRANCH="$2"
            shift 2
            ;;
        *)
            echo "Argumento desconocido: $1"
            exit 1
            ;;
    esac
done

# Verificar que las ramas existen
if ! git show-ref --verify --quiet refs/heads/$BASE_BRANCH; then
    echo "Error: La rama '$BASE_BRANCH' no existe"
    exit 1
fi

if ! git show-ref --verify --quiet refs/heads/$HEAD_BRANCH; then
    echo "Error: La rama '$HEAD_BRANCH' no existe"
    exit 1
fi

# Obtener información de commits
COMMITS=$(git log --oneline $BASE_BRANCH..$HEAD_BRANCH)
FILES_CHANGED=$(git diff --name-only $BASE_BRANCH..$HEAD_BRANCH)
NUM_COMMITS=$(echo "$COMMITS" | wc -l)
NUM_FILES=$(echo "$FILES_CHANGED" | wc -l)

# Generar título sugerido basado en los commits
FIRST_COMMIT=$(git log --format="%s" $BASE_BRANCH..$HEAD_BRANCH | tail -1)
TITLE=$(echo "$FIRST_COMMIT" | sed 's/^[a-z]*: //' | sed 's/^[a-z]*(//' | sed 's/)://')

# Determinar tipo de cambio
TYPE="feat"
if echo "$COMMITS" | grep -q "^[a-f0-9]* fix"; then
    TYPE="fix"
elif echo "$COMMITS" | grep -q "^[a-f0-9]* docs"; then
    TYPE="docs"
elif echo "$COMMITS" | grep -q "^[a-f0-9]* refactor"; then
    TYPE="refactor"
fi

echo "======================================"
echo "=€ SUGERENCIA DE TÍTULO PARA PR"
echo "======================================"
echo "$TYPE: $TITLE"
echo ""
echo "======================================"
echo "=Ë TEMPLATE PARA GITHUB"
echo "======================================"
echo ""
echo "## Resumen de los cambios"
echo "<!-- $NUM_COMMITS commit(s) y $NUM_FILES archivo(s) modificado(s) -->"
echo ""
echo "### Cambios principales:"
while IFS= read -r commit; do
    if [[ -n "$commit" ]]; then
        echo "- $(echo "$commit" | cut -d' ' -f2-)"
    fi
done <<< "$COMMITS"
echo ""
echo "### Archivos modificados:"
while IFS= read -r file; do
    if [[ -n "$file" ]]; then
        echo "- \`$file\`"
    fi
done <<< "$FILES_CHANGED"
echo ""
echo "## Notas"
echo ""
if [[ "$TYPE" == "fix" ]]; then
    echo "- [x] es FIX?"
else
    echo "- [ ] es FIX?"
fi
echo "- [x] Hacer merge"
echo "- [x] Borrar rama"
echo ""
echo "## Screenshots (Opcional)"
echo ""
```