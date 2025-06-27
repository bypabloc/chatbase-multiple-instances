# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client-side web application that provides a chatbot interface for multiple financial advisory AI assistants. The app integrates with Chatbase.co to manage multiple chatbot personalities, allowing users to switch between different financial experts.

## Development Commands

- `pnpm run dev` - Start development server with live reload on port 3000
- `pnpm run run-server` - Start HTTP server on port 3000 (alternative)

## Architecture

### Core Files
- `index.html` - Main HTML structure
- `script.js` - Core application logic (~890 lines)
- `styles.css` - Complete CSS styling
- `package.json` - Project configuration

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
- **No Testing Framework**: Currently no tests configured
- **No Build Process**: Direct file serving, no compilation step required