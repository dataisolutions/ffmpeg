const https = require('https');

// Configurazione
const RAILWAY_URL = 'https://ffmpeg-production-c6ca.up.railway.app';

// Test semplice per verificare la configurazione Supabase
async function testSupabaseConfig() {
  console.log('🔍 Testando configurazione Supabase su Railway...');
  console.log(`🌐 URL: ${RAILWAY_URL}`);
  
  const options = {
    hostname: RAILWAY_URL.replace('https://', ''),
    port: 443,
    path: '/',
    method: 'GET'
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          
          console.log('📊 Configurazione attuale:');
          console.log(`   Versione: ${result.version}`);
          console.log(`   Messaggio: ${result.message}`);
          
          // Verifica se Supabase è menzionato nel messaggio
          if (result.message && result.message.includes('Supabase')) {
            console.log('✅ Supabase è configurato nel progetto!');
          } else {
            console.log('ℹ️ Supabase non ancora configurato');
          }
          
          resolve(result);
          
        } catch (error) {
          console.error('❌ Errore parsing risposta:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Errore connessione:', error);
      reject(error);
    });
    
    req.end();
  });
}

// Esegui il test
async function runConfigTest() {
  try {
    console.log('🚀 Verificando configurazione Supabase...\n');
    
    const result = await testSupabaseConfig();
    
    console.log('\n💡 Prossimi passi:');
    console.log('1. Verifica che la variabile SUPABASE_ANON_KEY sia impostata su Railway');
    console.log('2. Aspetta 2-3 minuti per la propagazione');
    console.log('3. Esegui: npm run test-supabase');
    
  } catch (error) {
    console.error('\n❌ Test fallito:', error.message);
  }
}

if (require.main === module) {
  runConfigTest();
}

module.exports = { testSupabaseConfig }; 