// EVENT-DRIVEN SLOT OPENER - OPTIMIZED FOR SPEED
import pkg from '@whiskeysockets/baileys';
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = pkg;
import WebSocket from 'ws';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { TARGET_GROUP, EMOJI, BURST_COUNT, BURST_DELAY, MAX_RETRIES } from './config.js';

let sock = null;
let isReady = false;
let connecting = false;
let stats = { fired: 0, avgTime: 0, times: [] };
let currentRestricted = null;

// ULTRA-FAST MESSAGE BURST - INSTANT FIRING
async function fireBurst() {
  if (!sock || !isReady) return;
  
  const start = process.hrtime.bigint();
  console.log(`🔥 ADMINS OPENED GROUP! Firing ${BURST_COUNT} × ${EMOJI}...`);
  
  // Fire all messages with minimal stagger
  const promises = [];
  for (let i = 0; i < BURST_COUNT; i++) {
    promises.push((async () => {
      if (i > 0) await new Promise(r => setTimeout(r, BURST_DELAY * i));
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          await sock.sendMessage(TARGET_GROUP, { text: EMOJI });
          return true;
        } catch (error) {
          if (attempt === MAX_RETRIES - 1) {
            console.error(`❌ Message ${i + 1} failed: ${error.message}`);
            return false;
          }
          await new Promise(r => setTimeout(r, 15));
        }
      }
    })());
  }
  
  const results = await Promise.allSettled(promises);
  const sent = results.filter(r => r.status === 'fulfilled' && r.value).length;
  
  const time = Number(process.hrtime.bigint() - start) / 1_000_000;
  stats.fired++;
  stats.times.push(time);
  if (stats.times.length > 10) stats.times.shift();
  stats.avgTime = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;
  
  console.log(`✅ ${sent}/${BURST_COUNT} messages sent in ${time.toFixed(1)}ms!`);
  console.log(`📊 Total bursts: ${stats.fired}, Avg time: ${stats.avgTime.toFixed(1)}ms`);
}

async function initBot() {
  if (connecting) return;
  connecting = true;
  
  try {
    console.log('🚀 Initializing Event-Driven Slot Opener...');
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    
    sock = makeWASocket({
      auth: state,
      WebSocket,
      logger: pino({ level: 'silent' }),
      browser: ['SlotBot', 'Chrome', '1.0.0'],
      connectTimeoutMs: 10000,
      qrTimeout: 45000,
      retryRequestDelayMs: 200,
      maxMsgRetryCount: 2,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      fireInitQueries: true,
      emitOwnEvents: false,
      getMessage: async () => undefined
    });

    // PRIMARY DETECTION: Listen for real-time group update events
    sock.ev.on('groups.update', async (updates) => {
      // Diagnostic log to see all group update events
      console.log('DEBUG: Received groups.update event:', JSON.stringify(updates, null, 2));
      
      for (const update of updates) {
        // Check for the 'announce' property which controls 'admins only' mode
        if (update.id === TARGET_GROUP && 'announce' in update) {
          const isNowRestricted = update.announce;
          
          // If group changed from restricted to open
          if (currentRestricted === true && isNowRestricted === false) {
            console.log('🚨 DETECTED: Group opened via WebSocket event!');
            setImmediate(() => fireBurst());
          } else if (currentRestricted === false && isNowRestricted === true) {
            console.log('🔒 Status: Group is now ADMIN-ONLY.');
          }
          
          // Update the state regardless of the change
          currentRestricted = isNowRestricted;
        }
      }
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('\n🔥 SCAN QR CODE:\n');
        qrcode.generate(qr, { small: true });
        console.log('\n⏳ Scanning...');
      }
      
      if (connection === 'close') {
        isReady = false;
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (!shouldReconnect) {
          console.error('❌ Logged out! Delete ./auth and restart');
          process.exit(1);
        } else {
          console.log('🔄 Connection lost, reconnecting...');
          connecting = false;
          setTimeout(() => initBot(), 2000);
        }
      }
      
      if (connection === 'open') {
        isReady = true;
        console.log('✅ Connected and ready!\n');
        
        try {
          // Check initial group status on connect
          const meta = await sock.groupMetadata(TARGET_GROUP);
          // Use 'announce' which corresponds to the 'Only admins can send' setting
          currentRestricted = meta.announce || false;
          
          console.log(`🎯 Target Group: ${meta.subject}`);
          console.log(`👥 Members: ${meta.participants.length}`);
          console.log(`📊 Current Status: ${currentRestricted ? '🔒 ADMIN-ONLY MODE' : '🔓 EVERYONE CAN SEND'}`);
          
          // If group is already open on startup, fire immediately
          if (!currentRestricted) {
            console.log('✅ Group is already open. Firing burst immediately!');
            setImmediate(() => fireBurst());
          } else {
            console.log(`🔥 Ready to fire ${BURST_COUNT} × ${EMOJI} the instant admins open the group!\n`);
          }

          // SESSION WARMER: Keep the crypto session hot for ultra-fast sending
          console.log('[INFO] Starting session warmer to ensure instant message delivery...');
          setInterval(async () => {
            if (isReady && sock) {
              try {
                // Sending a 'composing' presence update is a lightweight way
                // to keep the session active without sending a real message.
                await sock.sendPresenceUpdate('composing', TARGET_GROUP);
              } catch (e) {
                // Ignore errors, the main connection logic will handle reconnects
              }
            }
          }, 45000); // Warm up every 45 seconds
          
        } catch (error) {
          console.error('❌ Cannot access target group:', error.message);
          process.exit(1);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log(`\n🛑 Shutting down...`);
      console.log(`📊 Final Stats: ${stats.fired} bursts fired, ${stats.avgTime.toFixed(1)}ms avg response`);
      process.exit(0);
    });

  } catch (error) {
    console.error('💥 Initialization error:', error.message);
    process.exit(1);
  }
}

// LAUNCH THE COMPETITION BOT
console.log('🚀🚀🚀 EVENT-DRIVEN GROUP OPENER 🚀🚀🚀');
console.log(`🎯 Target: ${TARGET_GROUP}`);
console.log(`🔥 Burst: ${BURST_COUNT} × ${EMOJI} (${BURST_DELAY}ms spacing)`);
console.log(`⚡ Mission: Detect group opening via real-time WebSocket events.`);
console.log(`💥 Action: Instantly fire emoji burst!`);
console.log('');

initBot();