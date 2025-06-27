# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client-side web application that provides a chatbot interface for multiple financial advisory AI assistants. The app integrates with Chatbase.co to manage multiple chatbot personalities, allowing users to switch between different financial experts.

## Development Commands

- `pnpm run dev` - Start Vite development server with HMR on port 3000
- `pnpm run build` - Build for production using Vite with optimizations
- `pnpm run preview` - Preview production build locally

### Code Quality Commands

- `pnpm run lint` - Check code with Biome linter
- `pnpm run lint:fix` - Fix linting issues automatically
- `pnpm run format` - Format code with Biome formatter
- `pnpm run check` - Run both linting and formatting (recommended)
- `pnpm run ci:check` - CI-friendly check without fixes

### Testing Commands

- `pnpm run test` - Run tests in watch mode
- `pnpm run test:run` - Run tests once
- `pnpm run test:coverage` - Run tests with coverage report
- `pnpm run test:ui` - Open Vitest UI

## Architecture

### Core Files
- `src/index.html` - Main HTML structure
- `src/script.js` - Core application logic (~890 lines)
- `src/styles.css` - Complete CSS styling
- `package.json` - Project configuration
- `vite.config.js` - Vite build configuration

### Key JavaScript Patterns

**Bot Instance Management**: The application uses a sophisticated instance tracking system:
- `chatInstances` object stores active Chatbase instances by botId
- `currentBotId` tracks the active bot
- `lastMinimizedBotId` remembers the last minimized chat for restoration

**Iframe Mode**: Uses iframe mode by default (`useIframeMode = true`) to avoid conflicts when switching between multiple bots. This is critical for proper bot management.

**State Persistence**: All bot configurations are stored in localStorage using `loadBots()` and `saveBots()` functions.

**Outside Click Management**: Implements outside-click handlers for chat minimization and restoration functionality.

### Bot Configuration Structure
Each bot object contains:
- `id`: Unique identifier (Chatbase bot ID)
- `name`: Display name
- `description`: Bot description
- `avatarUrl`: Avatar image URL (with fallback to initials)
- `expertise`: Area of specialization

### Critical Implementation Notes

1. **Bot Switching**: When switching between bots, existing instances are properly cleaned up to prevent memory leaks and UI conflicts.

2. **Instance Cleanup**: The `cleanupAllInstances()` function must be called when clearing bots or major state changes.

3. **Spanish Language**: The application is designed for Spanish-speaking users, particularly Chilean financial advisory context.

4. **Responsive Design**: The interface adapts between desktop and mobile layouts with different interaction patterns.

## Development Environment

- **Node.js**: Version >=22 (specified in .nvmrc)
- **Package Manager**: pnpm (version >=10)
- **Build Tool**: Vite 7.0+ with advanced optimizations
- **Linter/Formatter**: Biome.js 2.0+ (replaces ESLint + Prettier)
- **Testing Framework**: Vitest 3.2+ with 93%+ code coverage
- **Production Build**: Creates optimized assets in `dist/` directory with tree-shaking, minification, and asset hashing

## Code Quality Tools

### Biome.js Configuration

The project uses **Biome.js** as the modern replacement for ESLint + Prettier, offering:
- 🚀 **80% faster** than traditional tools
- 🔧 **Single configuration** file (`biome.json`)
- 🎯 **All-in-one** linting, formatting, and import sorting
- ⚡ **Rust-powered** performance

Key configuration settings:
- **Indent**: 4 spaces
- **Line width**: 100 characters
- **Quote style**: Single quotes for JS, double for JSX
- **Semicolons**: As needed (automatic)
- **Trailing commas**: ES5 compatible

Always run `pnpm check` before committing to ensure code quality.

### Git Hooks

The project has **automatic Git hooks** configured:

#### Pre-commit
1. Formats your code with Biome
2. Checks for linting errors
3. Blocks commits with errors

#### Pre-push
1. Verifies code quality with `biome ci`
2. Runs all tests with coverage
3. Validates coverage thresholds (≥90% statements/lines)
4. Blocks push if tests fail or coverage is low

To skip hooks in emergencies:
- Skip pre-commit: `git commit -m "message" --no-verify`
- Skip pre-push: `git push --no-verify`

### CI/CD with GitHub Actions

The project includes automated CI/CD pipelines:

#### Pull Request Verification (`verify-pr.yml`)
Runs automatically on:
- Pull requests to `dev` branch
- Pushes to any branch except `dev`, `main`, `master`

Verifications:
1. Code quality with Biome CI
2. Test suite with ≥90% coverage
3. Production build
4. No uncommitted changes

#### Local Testing with Act
Test GitHub Actions locally:
```bash
# Install act
curl -L https://github.com/nektos/act/releases/latest/download/act_Linux_x86_64.tar.gz | tar xz
sudo mv act /usr/local/bin/

# Test workflow
act push -W .github/workflows/verify-pr.yml
```

See `.github/workflows/act.md` for detailed instructions.