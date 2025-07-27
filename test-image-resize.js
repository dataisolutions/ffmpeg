const https = require('https');
const fs = require('fs');

// Configurazione
const RAILWAY_URL = 'https://ffmpeg-production-c6ca.up.railway.app';
const API_KEY = process.env.API_KEY || 'ARISE100';

// Dati di test con immagini e video reali
const TEST_POSTS = [
  {
    "display_url": "https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/505409549_18540295438045765_6560613733387924861_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QHycedxypkX4TzG6mzSmXF3rEUU1NyQ1GXyEwv_Kx6XXwe2nP46S4UW13MzXjaYqU0&_nc_ohc=M_VWs6ByayYQ7kNvwHo9kyW&_nc_gid=v17lZ3Dt6nanE3c9WCg68A&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfRTrptPGsfn3kSJLD7NyffdmnhQ67b596e0xCCcYQYQ7A&oe=688C0E42&_nc_sid=10d13b",
    "post_id": "3654135819875497044",
    "video_url": ""
  },
  {
    "display_url": "https://scontent-doh1-1.cdninstagram.com/v/t51.2885-15/523369326_18548119672045765_9144190222548513812_n.jpg?stp=dst-jpg_e15_fr_p1080x1080_tt6&_nc_ht=scontent-doh1-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QHEu37ZduPQfA0JHPtH-Yyg1Vj4gtmk5No5BIk27cDu-Lt9ncyYw0vly8ThXP3N4UA&_nc_ohc=7GdJ2xpFn-EQ7kNvwHc1yw6&_nc_gid=HPNZBEgMNCWPCPkUElPNnA&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfQ5UBFOKtaX6LyNuzXsbp2MkNw2x3yi6dAcV_1ZFM1oAg&oe=688C2630&_nc_sid=10d13b",
    "post_id": "3685269907469082962",
    "video_url": "https://scontent-doh1-1.cdninstagram.com/o1/v/t16/f2/m86/AQMj8B_hveHT8OAtVSBqN1Osd1h9_kEcmmV4g-gAFt58uy6wdCq1pOfvdEUbWwGjtEpC6J4knRJjawO5wb5WFBrxqzlAN5IUs6lMwAQ.mp4?stp=dst-mp4&efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uY2xpcHMuYzIuNzIwLmJhc2VsaW5lIn0&_nc_cat=109&vs=1089720889770936_392569033&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC9CRDQ5RkFEOTdEMkQwQkU4QjVDNDUwNzczOUNBRTE5M192aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYOnBhc3N0aHJvdWdoX2V2ZXJzdG9yZS9HQmV1UkJfeHZSRlgwT3dEQUc3el9GN2dlU2tjYnFfRUFBQUYVAgLIARIAKAAYABsAFQAAJoj5k9af69c%2FFQIoAkMzLBdAPfXCj1wo9hgSZGFzaF9iYXNlbGluZV8xX3YxEQB1%2Fgdl5p0BAA%3D%3D&_nc_rid=5a102c6470&ccb=9-4&oh=00_AfQpG-cGyKt5jVySo1kE_j86djl5mX_OveE3KBj-W2EA8w&oe=6888176E&_nc_sid=10d13b"
  },
  {
    "display_url": "https://scontent-man2-1.cdninstagram.com/v/t51.2885-15/523369326_18548119672045765_9144190222548513812_n.jpg?stp=dst-jpg_e15_fr_p1080x1080_tt6&_nc_ht=scontent-man2-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QHEu37ZduPQfA0JHPtH-Yyg1Vj4gtmk5No5BIk27cDu-Lt9ncyYw0vly8ThXP3N4UA&_nc_ohc=7GdJ2xpFn-EQ7kNvwHc1yw6&_nc_gid=HPNZBEgMNCWPCPkUElPNnA&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfQ5UBFOKtaX6LyNuzXsbp2MkNw2x3yi6dAcV_1ZFM1oAg&oe=688C2630&_nc_sid=10d13b",
    "post_id": "test_image_only",
    "video_url": ""
  }
];

// Funzione per testare il webhook con processing immagini
async function testImageResizeWebhook(posts) {
  console.log('🧪 Testando webhook con processing immagini...');
  console.log(`📦 Posts da processare: ${posts.length}`);
  console.log(`🖼️ Immagini da processare: ${posts.filter(p => p.display_url && p.display_url.trim() !== '').length}`);
  console.log(`🎬 Video da processare: ${posts.filter(p => p.video_url && p.video_url.trim() !== '').length}`);
  console.log(`🌐 API URL: ${RAILWAY_URL}/api/process-instagram-webhook`);
  console.log(`🔐 API Key: ${API_KEY}`);
  
  const postData = JSON.stringify({ posts });
  
  const options = {
    hostname: RAILWAY_URL.replace('https://', ''),
    port: 443,
    path: '/api/process-instagram-webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-api-key': API_KEY
    }
  };
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        try {
          const result = JSON.parse(responseData);
          
          console.log(`✅ Webhook completato in ${duration}ms`);
          console.log(`📊 Risultati:`, JSON.stringify(result, null, 2));
          
          resolve({
            success: true,
            duration,
            result
          });
          
        } catch (error) {
          console.error('❌ Errore nel parsing della risposta:', error);
          reject(new Error(`Errore parsing: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Errore di connessione:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test con i dati di esempio
async function runTest() {
  try {
    console.log('🚀 Iniziando test webhook con processing immagini...\n');
    console.log(`🔑 API Key utilizzata: ${API_KEY}`);
    console.log(`💡 Per cambiare API key, imposta la variabile d'ambiente: API_KEY=la-tua-chiave\n`);
    
    const result = await testImageResizeWebhook(TEST_POSTS);
    
    console.log('\n🎉 Test completato con successo!');
    console.log(`⏱️  Tempo totale: ${result.duration}ms`);
    console.log(`📊 Post processati: ${result.result.processed || 0}`);
    console.log(`🎬 Video processati: ${result.result.video_processed || 0}`);
    console.log(`🖼️ Immagini processate: ${result.result.images_processed || 0}`);
    console.log(`❌ Errori: ${result.result.failed || 0}`);
    
    if (result.result.results) {
      console.log('\n📋 Dettagli elaborazione:');
      result.result.results.forEach((item, index) => {
        if (item.success) {
          let details = `  ✅ [${index + 1}] ${item.post_id}:`;
          
          if (item.has_video && item.audio) {
            details += ` MP3: ${item.audio.audio_size_mb}MB`;
          }
          
          if (item.has_image && item.image && item.image.success) {
            details += ` | Thumb: ${(item.image.resizedSize / 1024).toFixed(1)}KB (${item.image.width}px)`;
          }
          
          console.log(details);
        } else {
          console.log(`  ❌ [${index + 1}] ${item.post_id}: ${item.error}`);
        }
      });
    }
    
    // Salva i risultati in un file JSON per analisi
    const timestamp = Date.now();
    const filename = `test_results_${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(result.result, null, 2));
    console.log(`\n💾 Risultati salvati in: ${filename}`);
    
  } catch (error) {
    console.error('\n❌ Test fallito:', error.message);
  }
}

// Esegui il test se chiamato direttamente
if (require.main === module) {
  runTest();
}

module.exports = { testImageResizeWebhook }; 