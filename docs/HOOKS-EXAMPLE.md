# Ejemplos de Git Hooks en Acción

## 🎯 Pre-commit Hook

### ✅ Commit Exitoso

```bash
$ git commit -m "feat: nueva funcionalidad"

[STARTED] Running tasks for staged files...
[STARTED] *.{js,jsx,ts,tsx} — 2 files
[STARTED] biome format --write --no-errors-on-unmatched
[COMPLETED] biome format --write --no-errors-on-unmatched
[STARTED] biome lint --write --no-errors-on-unmatched
[COMPLETED] biome lint --write --no-errors-on-unmatched
[COMPLETED] Running tasks for staged files...

[main abc1234] feat: nueva funcionalidad
 2 files changed, 50 insertions(+)
```

### ❌ Commit Bloqueado

```bash
$ git commit -m "fix: corrección"

[STARTED] Running tasks for staged files...
[STARTED] biome lint --write --no-errors-on-unmatched
[FAILED] biome lint --write --no-errors-on-unmatched

✖ This function test is unused.
  > 6 │ function test() {
      │          ^^^^

husky - pre-commit script failed (code 1)
```

## 🚀 Pre-push Hook

### ✅ Push Exitoso

```bash
$ git push origin main

╔═══════════════════════════════════════════════════════════╗
║                  🚀 PRE-PUSH CHECKS                       ║
╚═══════════════════════════════════════════════════════════╝

1️⃣  Checking code quality with Biome...
───────────────────────────────────────────
Checked 2 files in 19ms. No fixes applied.
✅ Code quality check passed!

2️⃣  Running tests with coverage...
───────────────────────────────────────────
 Test Files  10 passed (10)
      Tests  202 passed (202)

 % Coverage report from v8
-----------|---------|----------|---------|---------|
File       | % Stmts | % Branch | % Funcs | % Lines |
-----------|---------|----------|---------|---------|
All files  |   93.41 |    90.33 |   80.72 |   93.41 |
-----------|---------|----------|---------|---------|

╔═══════════════════════════════════════════════════════════╗
║          ✅ ALL PRE-PUSH CHECKS PASSED! 🎉               ║
╚═══════════════════════════════════════════════════════════╝

Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Writing objects: 100% (3/3), 1.24 KiB | 1.24 MiB/s, done.
Total 3 (delta 2), reused 0 (delta 0)
To github.com:bypabloc/chatbase-multiple-instances.git
   abc1234..def5678  main -> main
```

### ❌ Push Bloqueado por Calidad de Código

```bash
$ git push origin main

╔═══════════════════════════════════════════════════════════╗
║                  🚀 PRE-PUSH CHECKS                       ║
╚═══════════════════════════════════════════════════════════╝

1️⃣  Checking code quality with Biome...
───────────────────────────────────────────
src/script.js:42:10 lint error: Unused variable

❌ Code quality check failed!
💡 Run 'pnpm check' to fix issues automatically

error: failed to push some refs to 'github.com:bypabloc/chatbase-multiple-instances.git'
```

### ❌ Push Bloqueado por Tests Fallidos

```bash
$ git push origin main

╔═══════════════════════════════════════════════════════════╗
║                  🚀 PRE-PUSH CHECKS                       ║
╚═══════════════════════════════════════════════════════════╝

1️⃣  Checking code quality with Biome...
───────────────────────────────────────────
✅ Code quality check passed!

2️⃣  Running tests with coverage...
───────────────────────────────────────────
 FAIL  test/ChatbaseManager.test.js
  × should initialize manager correctly
    Expected: "ChatbaseManager"
    Received: undefined

 Test Files  1 failed | 9 passed (10)
      Tests  1 failed | 201 passed (202)

❌ Tests failed or coverage is below threshold!

📊 Required coverage thresholds:
   • Lines: 90%
   • Functions: 75%
   • Branches: 88%
   • Statements: 90%

💡 Tips:
   • Run 'pnpm test:coverage' to see detailed results
   • Check coverage/index.html for visual report
   • Add more tests to increase coverage

error: failed to push some refs to 'github.com:bypabloc/chatbase-multiple-instances.git'
```

### ❌ Push Bloqueado por Baja Cobertura

```bash
$ git push origin main

╔═══════════════════════════════════════════════════════════╗
║                  🚀 PRE-PUSH CHECKS                       ║
╚═══════════════════════════════════════════════════════════╝

1️⃣  Checking code quality with Biome...
───────────────────────────────────────────
✅ Code quality check passed!

2️⃣  Running tests with coverage...
───────────────────────────────────────────
 Test Files  10 passed (10)
      Tests  202 passed (202)

 % Coverage report from v8
-----------|---------|----------|---------|---------|
File       | % Stmts | % Branch | % Funcs | % Lines |
-----------|---------|----------|---------|---------|
All files  |   85.23 |    82.15 |   70.12 |   85.23 |
-----------|---------|----------|---------|---------|

ERROR: Coverage for statements (85.23%) does not meet global threshold (90%)

❌ Tests failed or coverage is below threshold!

📊 Required coverage thresholds:
   • Lines: 90%
   • Functions: 75%
   • Branches: 88%
   • Statements: 90%

💡 Tips:
   • Run 'pnpm test:coverage' to see detailed results
   • Check coverage/index.html for visual report
   • Add more tests to increase coverage

error: failed to push some refs to 'github.com:bypabloc/chatbase-multiple-instances.git'
```

## 🛠️ Comandos de Emergencia

### Forzar Commit (Saltar pre-commit)

```bash
git commit -m "hotfix: corrección urgente" --no-verify
```

### Forzar Push (Saltar pre-push)

```bash
git push origin main --no-verify
```

⚠️ **ADVERTENCIA**: Usar estos comandos puede introducir código con errores o sin tests adecuados. Úsalos solo en situaciones de emergencia real.