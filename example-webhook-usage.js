/**
 * Esempio di utilizzo del Webhook Instagram con Risposta Immediata
 * 
 * Questo esempio mostra come:
 * 1. Inviare una richiesta al webhook
 * 2. Ricevere la conferma immediata
 * 3. Monitorare l'elaborazione in background
 */

const fetch = require('node-fetch').default;

const API_URL = 'https://ffmpeg-production-c6ca.up.railway.app';
const API_KEY = 'ARISE100';

async function exampleWebhookUsage() {
  console.log('🚀 Esempio utilizzo Webhook Instagram con Risposta Immediata\n');
  
  // Dati di esempio (sostituisci con dati reali)
  const webhookData = {
    posts: [
      {
        post_id: 'example_123',
        display_url: 'https://example.com/image1.jpg',
        video_url: 'https://example.com/video1.mp4'
      },
      {
        post_id: 'example_456',
        display_url: 'https://example.com/image2.jpg',
        video_url: 'https://example.com/video2.mp4'
      }
    ]
  };
  
  try {
    console.log('📤 1. Invio richiesta al webhook...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_URL}/api/process-instagram-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(webhookData)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️ Tempo di risposta: ${responseTime}ms`);
    
    if (response.ok) {
      const result = await response.json();
      
      console.log('✅ 2. Conferma ricevuta immediatamente!');
      console.log('📋 Dettagli conferma:');
      console.log(JSON.stringify(result, null, 2));
      
      if (responseTime < 1000) {
        console.log('\n🎉 SUCCESSO: Webhook risponde immediatamente!');
      }
      
      console.log('\n📊 3. Monitoraggio elaborazione:');
      console.log('- L\'elaborazione continua in background');
      console.log('- Controlla i log su Railway per lo stato di avanzamento');
      console.log('- Usa l\'endpoint /api/processing-status per informazioni');
      
    } else {
      console.log('❌ Errore nella risposta:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Dettagli errore:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Errore durante l\'invio:', error.message);
  }
}

async function checkProcessingStatus() {
  console.log('\n📊 Controllo status elaborazione...\n');
  
  try {
    const response = await fetch(`${API_URL}/api/processing-status`);
    const result = await response.json();
    
    console.log('✅ Status elaborazione:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Errore status elaborazione:', error.message);
  }
}

async function runExample() {
  await exampleWebhookUsage();
  await checkProcessingStatus();
  
  console.log('\n✨ Esempio completato!');
  console.log('\n💡 Suggerimenti:');
  console.log('- Sostituisci gli URL di esempio con URL reali');
  console.log('- Il webhook processerà i contenuti in background');
  console.log('- Controlla i log su Railway per monitorare l\'avanzamento');
}

// Esegui l'esempio
runExample().catch(console.error); 