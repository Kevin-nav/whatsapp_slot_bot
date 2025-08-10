# GEMINI Project Analysis: wa-slotbot

## Project Overview

This project, `wa-slotbot`, is a high-performance WhatsApp bot built with Node.js. Its primary purpose is to gain a competitive advantage in "slot opening" events in WhatsApp groups. It continuously monitors a specific target group and, the instant that group's restrictions are lifted (changing from "admins-only" to "everyone can send"), it fires a rapid burst of pre-configured messages to secure a "slot."

The architecture is optimized for speed, featuring sub-millisecond response times, adaptive rate-limiting checks, and direct WebSocket event listeners for immediate reaction. It uses the `@whiskeysockets/baileys` library for WhatsApp communication.

## Building and Running

The project is managed with `npm`.

**1. Installation:**
First, install the required Node.js dependencies.

```bash
npm install
```

**2. Configuration:**
Before running the bot, you must configure it with your target group's ID.

*   **Get Group ID:** Run the `groups` script. You will be prompted to scan a QR code with your WhatsApp mobile app to log in. It will then print a list of all your groups and their IDs.

    ```bash
    npm run groups
    ```

*   **Edit `config.js`:** Copy the desired group ID and paste it into the `config.js` file, replacing the placeholder. You can also customize the message emoji and burst behavior here.

    ```javascript
    // config.js
    export const TARGET_GROUP = 'your-actual-group-id@g.us';
    export const EMOJI = '✋🏿';
    export const BURST_COUNT = 5;
    export const BURST_DELAY = 25;
    ```

**3. Running the Bot:**
Once configured, start the bot using the `start` script. It will connect and begin monitoring the target group.

```bash
npm start
```

## Development Conventions

*   **Technology Stack:** The project uses modern Node.js with ES Modules (`"type": "module"` in `package.json`).
*   **Core Library:** The primary dependency is `@whiskeysockets/baileys`, a powerful library for building WhatsApp bots.
*   **Performance Focus:** The code is heavily optimized for speed. Key patterns include:
    *   Using `setImmediate()` to fire messages instantly upon detection, bypassing the Node.js event loop queue.
    *   An adaptive backoff mechanism for the `groupMetadata` check to avoid WhatsApp's rate limits.
    *   Silent logging (`pino({ level: 'silent' })`) during operation to eliminate I/O overhead.
*   **Authentication:** Session data is stored locally in the `./auth` directory. To re-authenticate, this directory must be deleted.
*   **Code Style:** The code is well-commented, with a clear separation of concerns between the main bot logic (`index.js`), configuration (`config.js`), and utility scripts (`getGroups.js`).
