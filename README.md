# WhatsApp Slot Bot

A high-performance, event-driven WhatsApp bot designed to gain a competitive advantage in "slot opening" events. It uses the `@whiskeysockets/baileys` library to monitor a target group and instantly sends a pre-configured burst of messages the moment the group's restrictions are lifted.

This bot is optimized for speed, featuring sub-millisecond response times by using a real-time, event-driven approach and a session-warming mechanism to eliminate cryptographic handshake delays.

## Key Features

- **Event-Driven:** Listens directly for WebSocket events (`groups.update`) to detect group setting changes in real-time, avoiding slow and risky polling.
- **High-Speed Burst:** Fires a rapid burst of messages with configurable delay and retry attempts to secure a slot.
- **Session Warmer:** Periodically sends lightweight presence updates to keep the cryptographic session "hot," ensuring messages can be sent instantly without handshake delays.
- **Fires on Start:** Can be configured to fire immediately if the target group is already open when the bot starts.
- **Robust & Resilient:** Includes logic for automatic reconnection and safe error handling.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### 1. Installation

Clone the repository and install the required dependencies.

```bash
git clone <your-repo-url>
cd wa-slotbot
npm install
```

### 2. Configuration

Before running the bot, you must configure your target group and message settings.

**A. Find Your Group ID**

To get the ID of your target group, run the `groups` script. You will be prompted to scan a QR code with your WhatsApp mobile app to log in. It will then print a list of all your groups and their unique IDs.

```bash
npm run groups
```

Copy the ID of the group you want to target (it will look like `1234567890@g.us`).

**B. Edit `config.js`**

Open the `config.js` file and update the following values:

```javascript
// config.js
export const TARGET_GROUP = 'your-actual-group-id@g.us'; // Paste the Group ID here
export const EMOJI = '✋🏿'; // The message/emoji you want to send
export const BURST_COUNT = 5; // How many messages to send in the burst
export const BURST_DELAY = 25; // Delay in milliseconds between each message in the burst
export const MAX_RETRIES = 2; // How many times to retry a failed message
```

## Usage

Once configured, start the bot using the `start` script. It will connect to WhatsApp and begin monitoring the target group.

```bash
npm start
```

The bot will log its status to the console. It will fire automatically when the configured conditions are met.

---

## ⚠️ Disclaimer and Warning

This project is intended for educational purposes and to demonstrate event-driven programming in a real-world scenario. Using this bot, or any automated script, on WhatsApp's platform is against their Terms of Service.

- **RISK OF BAN:** Automating user actions can lead to your phone number being **temporarily or permanently banned** by WhatsApp.
- **USE A BURNER ACCOUNT:** It is **strongly recommended** that you use a "burner" phone number or an account that you do not care about losing. **Do not use your primary WhatsApp account.**

The developers of this project are not responsible for any consequences that may arise from its use. Use at your own risk.
