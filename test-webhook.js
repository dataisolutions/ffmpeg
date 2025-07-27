const https = require('https');
const fs = require('fs');

// Configurazione
const RAILWAY_URL = 'https://ffmpeg-production-c6ca.up.railway.app';
const API_KEY = process.env.API_KEY || 'ARISE100'; // Usa variabile d'ambiente o fallback per test
const TEST_VIDEO_URL = 'https://scontent-man2-1.cdninstagram.com/o1/v/t16/f2/m86/AQMg3ji6V4D4fmp1jiRYX1BtiFeY1lZcswWy8y-CTxhwvCfui1YgpB4buxNgKNZXODaC-EWz4hKeAeQeg-0WFXMXp4F9wmi3lwBDN3A.mp4?stp=dst-mp4&efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uY2xpcHMuYzIuNzIwLmJhc2VsaW5lIn0&_nc_cat=110&vs=8299692173488003_2237610040&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC81OTRFQUNCMEM1RTlBNDA5MUVGMTk4MUJBNENEMTdCNV92aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYOnBhc3N0aHJvdWdoX2V2ZXJzdG9yZS9HTkdqM2g2ekZENC1JVFVGQU4zSVYxdUhlQlJVYnFfRUFBQUYVAgLIARIAKAAYABsAFQAAJqSbgensrNQ%2FFQIoAkMzLBdARyPXCj1wpBgSZGFzaF9iYXNlbGluZV8xX3YxEQB1%2Fgdl5p0BAA%3D%3D&_nc_rid=e931542f8d&ccb=9-4&oh=00_AfR-EotaWWHClbA6yRKDWgD6CZ26ma5D9APUiwgT7PsT2g&oe=68881D03&_nc_sid=10d13b';

// Funzione per testare l'estrazione MP3
async function testMP3Extraction(videoUrl) {
  console.log('🧪 Testando estrazione MP3...');
  console.log(`📹 Video URL: ${videoUrl}`);
  console.log(`🌐 API URL: ${RAILWAY_URL}/api/extract-mp3`);
  console.log(`🔐 API Key: ${API_KEY}`);
  
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
      'Content-Length': Buffer.byteLength(postData),
      'x-api-key': API_KEY
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
    console.log('🚀 Iniziando test MP3 extraction con autenticazione...\n');
    console.log(`🔑 API Key utilizzata: ${API_KEY}`);
    console.log(`💡 Per cambiare API key, imposta la variabile d'ambiente: API_KEY=la-tua-chiave\n`);
    
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