const https = require('https');
const fs = require('fs');

// Configurazione
const RAILWAY_URL = 'https://ffmpeg-production-c6ca.up.railway.app';
const TEST_VIDEO_URL = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'; // URL di esempio

// Funzione per testare l'estrazione MP3
async function testMP3Extraction(videoUrl) {
  console.log('🧪 Testando estrazione MP3...');
  console.log(`📹 Video URL: ${videoUrl}`);
  console.log(`🌐 API URL: ${RAILWAY_URL}/api/extract-mp3`);
  
  const postData = JSON.stringify({
    videoUrl: videoUrl
  });
  
  const options = {
    hostname: RAILWAY_URL.replace('https://', ''),
    port: 443,
    path: '/api/extract-mp3',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      if (res.statusCode === 200) {
        const chunks = [];
        
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          const audioBuffer = Buffer.concat(chunks);
          const filename = `extracted_${Date.now()}.mp3`;
          
          fs.writeFileSync(filename, audioBuffer);
          console.log(`✅ MP3 estratto e salvato come: ${filename}`);
          console.log(`📊 Dimensione file: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          
          resolve({
            success: true,
            filename: filename,
            size: audioBuffer.length
          });
        });
      } else {
        let errorData = '';
        res.on('data', (chunk) => {
          errorData += chunk;
        });
        
        res.on('end', () => {
          console.error('❌ Errore:', errorData);
          reject(new Error(`HTTP ${res.statusCode}: ${errorData}`));
        });
      }
    });
    
    req.on('error', (error) => {
      console.error('❌ Errore di connessione:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test con URL di esempio
async function runTest() {
  try {
    console.log('🚀 Iniziando test MP3 extraction...\n');
    
    const result = await testMP3Extraction(TEST_VIDEO_URL);
    
    console.log('\n🎉 Test completato con successo!');
    console.log(`📁 File salvato: ${result.filename}`);
    console.log(`📊 Dimensione: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('\n❌ Test fallito:', error.message);
  }
}

// Esegui il test se chiamato direttamente
if (require.main === module) {
  runTest();
}

module.exports = { testMP3Extraction }; 