// ULTRA-FAST GROUP ID FETCHER - UPDATED BAILEYS
import pkg from '@whiskeysockets/baileys';
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = pkg;
import { Boom } from '@hapi/boom';
import WebSocket from 'ws';
import qrcode from 'qrcode-terminal';
import pino from 'pino';

async function getGroups() {
  console.log('🚀 Starting groups fetcher...');
  
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  
  const sock = makeWASocket({
    auth: state,
    WebSocket,
    logger: pino({ level: 'silent' }),
    browser: ['SlotBot', 'Chrome', '1.0.0']
  });

  return new Promise((resolve, reject) => {
    let connected = false;
    
    const timeout = setTimeout(() => {
      if (!connected) {
        console.log('❌ Connection timeout');
        process.exit(1);
      }
    }, 60000);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('\n🔥 SCAN QR CODE:\n');
        qrcode.generate(qr, { small: true });
        console.log('\n⏳ Waiting for scan...');
      }
      
      if (connection === 'close') {
        clearTimeout(timeout);
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (!shouldReconnect) {
          console.log('❌ Logged out! Delete ./auth folder and restart');
          process.exit(1);
        } else {
          console.log('❌ Connection error:', lastDisconnect?.error?.message || 'Unknown error');
          process.exit(1);
        }
      }
      
      if (connection === 'open') {
        connected = true;
        clearTimeout(timeout);
        console.log('✅ Connected! Getting groups...\n');
        
        try {
          const chats = await sock.groupFetchAllParticipating();
          const groups = Object.values(chats);
          
          console.log('🎯 YOUR GROUPS:\n');
          groups.forEach((g, i) => {
            console.log(`${i + 1}. ${g.subject || 'Unnamed'}`);
            console.log(`   ID: ${g.id}`);
            console.log(`   Status: ${g.restrict ? '🔒 RESTRICTED' : '🔓 OPEN'}\n`);
          });
          
          console.log('📋 SETUP INSTRUCTIONS:');
          console.log('1. Copy the Group ID of your target group');
          console.log('2. Edit config.js');
          console.log('3. Replace: YOUR_GROUP_ID_HERE@g.us');
          console.log('4. With your actual Group ID');
          console.log('5. Save and run: npm start\n');
          
          await sock.end();
          process.exit(0);
          
        } catch (error) {
          console.error('❌ Failed to get groups:', error.message);
          process.exit(1);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);
  });
}

getGroups().catch(error => {
  console.error('💥 Error:', error.message);
  process.exit(1);
});