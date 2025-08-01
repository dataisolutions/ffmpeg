const fetch = require('node-fetch').default;

const API_URL = 'https://ffmpeg-production-c6ca.up.railway.app';
const API_KEY = 'ARISE100';

async function testImmediateResponse() {
  console.log('🧪 Test risposta immediata del webhook Instagram...\n');
  
  const testData = {
    posts: [
      {
        post_id: 'test_immediate_1',
        display_url: 'https://example.com/image1.jpg',
        video_url: 'https://example.com/video1.mp4'
      },
      {
        post_id: 'test_immediate_2', 
        display_url: 'https://example.com/image2.jpg',
        video_url: 'https://example.com/video2.mp4'
      }
    ]
  };
  
  try {
    console.log('📤 Invio richiesta al webhook...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_URL}/api/process-instagram-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(testData)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️ Tempo di risposta: ${responseTime}ms`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Risposta ricevuta con successo!');
      console.log('📋 Dettagli risposta:');
      console.log(JSON.stringify(result, null, 2));
      
      if (responseTime < 1000) {
        console.log('\n🎉 SUCCESSO: Il webhook risponde immediatamente!');
      } else {
        console.log('\n⚠️ ATTENZIONE: Il webhook potrebbe ancora essere lento');
      }
      
    } else {
      console.log('❌ Errore nella risposta:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Dettagli errore:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Test health check...\n');
  
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const result = await response.json();
    
    console.log('✅ Health check OK');
    console.log('📋 Informazioni API:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Errore health check:', error.message);
  }
}

async function testProcessingStatus() {
  console.log('\n📊 Test status elaborazione...\n');
  
  try {
    const response = await fetch(`${API_URL}/api/processing-status`);
    const result = await response.json();
    
    console.log('✅ Status elaborazione OK');
    console.log('📋 Informazioni elaborazione:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Errore status elaborazione:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Avvio test risposta immediata webhook Instagram\n');
  
  await testHealthCheck();
  await testProcessingStatus();
  await testImmediateResponse();
  
  console.log('\n✨ Test completati!');
}

// Esegui i test
runAllTests().catch(console.error); 