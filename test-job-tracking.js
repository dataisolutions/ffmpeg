/**
 * Test del Sistema di Tracking Job - v2.5.0
 * 
 * Questo test verifica:
 * 1. Invio webhook con risposta immediata e job ID
 * 2. Controllo stato job in tempo reale
 * 3. Conferma completamento elaborazione
 */

const fetch = require('node-fetch').default;

const API_URL = 'https://ffmpeg-production-c6ca.up.railway.app';
const API_KEY = 'ARISE100';

async function testJobTracking() {
  console.log('🚀 Test Sistema di Tracking Job - v2.5.0\n');
  
  // Dati di test (URL di esempio)
  const testData = {
    posts: [
      {
        post_id: 'test_job_1',
        display_url: 'https://example.com/image1.jpg',
        video_url: 'https://example.com/video1.mp4'
      },
      {
        post_id: 'test_job_2',
        display_url: 'https://example.com/image2.jpg',
        video_url: 'https://example.com/video2.mp4'
      },
      {
        post_id: 'test_job_3',
        display_url: 'https://example.com/image3.jpg',
        video_url: 'https://example.com/video3.mp4'
      }
    ]
  };
  
  try {
    console.log('📤 1. Invio webhook con tracking...');
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
      console.log('✅ Webhook ricevuto con successo!');
      console.log('📋 Risposta:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.job_id) {
        console.log(`\n📋 Job ID ricevuto: ${result.job_id}`);
        
        // Test controllo stato job
        await testJobStatus(result.job_id);
        
      } else {
        console.log('❌ Job ID non presente nella risposta');
      }
      
    } else {
      console.log('❌ Errore webhook:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Dettagli errore:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  }
}

async function testJobStatus(jobId) {
  console.log(`\n📊 2. Controllo stato job ${jobId}...`);
  
  try {
    const response = await fetch(`${API_URL}/api/job-status/${jobId}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Stato job ricevuto:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.job.status === 'processing') {
        console.log(`\n⏳ Job in elaborazione: ${result.job.progress_percentage}% completato`);
        console.log(`📈 Processati: ${result.job.processed}/${result.job.total_posts}`);
        
        // Controlla di nuovo dopo 5 secondi
        setTimeout(async () => {
          console.log('\n🔄 Controllo aggiornamento stato...');
          await testJobStatus(jobId);
        }, 5000);
        
      } else if (result.job.status === 'completed') {
        console.log('\n🎉 Job completato!');
        console.log('📊 Risultati finali:');
        console.log(JSON.stringify(result.summary, null, 2));
        
      } else if (result.job.status === 'failed') {
        console.log('\n❌ Job fallito:', result.job.error);
      }
      
    } else {
      console.log('❌ Errore controllo stato:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Errore controllo stato job:', error.message);
  }
}

async function testJobsList() {
  console.log('\n📋 3. Lista job attivi...');
  
  try {
    const response = await fetch(`${API_URL}/api/jobs`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Lista job:');
      console.log(JSON.stringify(result, null, 2));
      
    } else {
      console.log('❌ Errore lista job:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Errore lista job:', error.message);
  }
}

async function runAllTests() {
  await testJobTracking();
  await testJobsList();
  
  console.log('\n✨ Test completati!');
  console.log('\n💡 Suggerimenti:');
  console.log('- Il job ID permette di tracciare l\'elaborazione in tempo reale');
  console.log('- Usa /api/job-status/{job_id} per controllare lo stato');
  console.log('- Usa /api/jobs per vedere tutti i job attivi');
}

// Esegui i test
runAllTests().catch(console.error); 