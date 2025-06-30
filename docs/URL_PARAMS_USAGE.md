# URL Parameters Usage Guide

This document explains how to use URL parameters to load bots into the Chatbase application.

## Basic Usage

### Simple Bot ID
Load a bot by providing just its ID:
```
https://yoursite.com/?bot_1=YOUR_BOT_ID
```

### Multiple Bots
Load multiple bots by adding multiple parameters:
```
https://yoursite.com/?bot_1=BOT_ID_1&bot_2=BOT_ID_2&bot_3=BOT_ID_3
```

### Full Bot Configuration
Load a bot with complete configuration using JSON:
```
https://yoursite.com/?bot_1={"id":"YOUR_BOT_ID","name":"Bot Name","description":"Bot description","avatarUrl":"https://example.com/avatar.jpg","expertise":"Finance"}
```

Note: The JSON must be properly URL-encoded. Use `encodeURIComponent()` in JavaScript:
```javascript
const botConfig = {
    id: "YOUR_BOT_ID",
    name: "Financial Advisor",
    description: "Helps with your finances",
    avatarUrl: "https://example.com/avatar.jpg",
    expertise: "Personal Finance"
};

const url = `https://yoursite.com/?bot_1=${encodeURIComponent(JSON.stringify(botConfig))}`;
```

## Cookie Storage

- Bot parameters are automatically saved to cookies for 7 days
- If a bot is already in cookies, it won't be loaded again from the URL
- This prevents duplicate bots when refreshing the page
- Cookies are stored under the name `chatbase_query_params`

## Parameter Format

- Parameters must start with `bot_` prefix (e.g., `bot_1`, `bot_2`, etc.)
- Values can be either:
  - Simple string: Bot ID only
  - JSON object: Full bot configuration

## URL Cleanup

After loading bots from URL parameters:
- The parameters are automatically removed from the URL
- This keeps the URL clean and prevents reloading on refresh
- The original parameters are preserved in cookies

## Examples

### Example 1: Load a single bot
```
https://yoursite.com/?bot_1=abc123xyz
```

### Example 2: Load multiple bots with mixed formats
```
https://yoursite.com/?bot_1=simple_bot_id&bot_2={"id":"complex_bot","name":"Complex Bot","description":"A bot with full config"}
```

### Example 3: JavaScript code to generate URL
```javascript
// Simple bot
const simpleUrl = 'https://yoursite.com/?bot_1=my_bot_id';

// Complex bot with full configuration
const bot = {
    id: 'financial_advisor_001',
    name: 'María - Asesora Financiera',
    description: 'Te ayuda a ordenar tus finanzas personales',
    avatarUrl: 'https://example.com/maria-avatar.jpg',
    expertise: 'Finanzas Personales'
};

const complexUrl = `https://yoursite.com/?bot_1=${encodeURIComponent(JSON.stringify(bot))}`;

// Multiple bots
const bot1 = { id: 'bot1', name: 'Bot 1' };
const bot2 = { id: 'bot2', name: 'Bot 2' };

const multiUrl = `https://yoursite.com/?bot_1=${encodeURIComponent(JSON.stringify(bot1))}&bot_2=${encodeURIComponent(JSON.stringify(bot2))}`;
```

## Technical Details

- The `url-params.js` script handles all URL parameter processing
- Parameters are processed on page load after the DOM is ready
- Existing bots (already saved in localStorage) are not duplicated
- The UI automatically refreshes after loading new bots