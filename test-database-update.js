const https = require('https');

// Configurazione
const RAILWAY_URL = 'https://ffmpeg-production-c6ca.up.railway.app';
const API_KEY = 'ARISE100'; // Sostituisci con la tua API key

// Test data con post_id che dovrebbero esistere nella tabella instagram_posts
const testPosts = [
  {
    display_url: "https://scontent-ord5-1.cdninstagram.com/v/t51.2885-15/505409549_18540295438045765_6560613733387924861_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QHycedxypkX4TzG6mzSmXF3rEUU1NyQ1GXyEwv_Kx6XXwe2nP46S4UW13MzXjaYqU0&_nc_ohc=M_VWs6ByayYQ7kNvwHo9kyW&_nc_gid=v17lZ3Dt6nanE3c9WCg68A&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfRTrptPGsfn3kSJLD7NyffdmnhQ67b596e0xCCcYQYQ7A&oe=688C0E42&_nc_sid=10d13b",
    post_id: "3654135819875497044",
    video_url: ""
  },
  {
    display_url: "https://scontent-doh1-1.cdninstagram.com/v/t51.2885-15/523369326_18548119672045765_9144190222548513812_n.jpg?stp=dst-jpg_e15_fr_p1080x1080_tt6&_nc_ht=scontent-doh1-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QHEu37ZduPQfA0JHPtH-Yyg1Vj4gtmk5No5BIk27cDu-Lt9ncyYw0vly8ThXP3N4UA&_nc_ohc=7GdJ2xpFn-EQ7kNvwHc1yw6&_nc_gid=HPNZBEgMNCWPCPkUElPNnA&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfQ5UBFOKtaX6LyNuzXsbp2MkNw2x3yi6dAcV_1ZFM1oAg&oe=688C2630&_nc_sid=10d13b",
    post_id: "3685269907469082962",
    video_url: "https://scontent-doh1-1.cdninstagram.com/o1/v/t16/f2/m86/AQMj8B_hveHT8OAtVSBqN1Osd1h9_kEcmmV4g-gAFt58uy6wdCq1pOfvdEUbWwGjtEpC6J4knRJjawO5wb5WFBrxqzlAN5IUs6lMwAQ.mp4?stp=dst-mp4&efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uY2xpcHMuYzIuNzIwLmJhc2VsaW5lIn0&_nc_cat=109&vs=1089720889770936_392569033&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC9CRDQ5RkFEOTdEMkQwQkU4QjVDNDUwNzczOUNBRTE5M192aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYOnBhc3N0aHJvdWdoX2V2ZXJzdG9yZS9HQmV1UkJfeHZSRlgwT3dEQUc3el9GN2dlU2tjYnFfRUFBQUYVAgLIARIAKAAYABsAFQAAJoj5k9af69c%2FFQIoAkMzLBdAPfXCj1wo9hgSZGFzaF9iYXNlbGluZV8xX3YxEQB1%2Fgdl5p0BAA%3D%3D&_nc_rid=5a102c6470&ccb=9-4&oh=00_AfQpG-cGyKt5jVySo1kE_j86djl5mX_OveE3KBj-W2EA8w&oe=6888176E&_nc_sid=10d13b"
  }
];

// Funzione per testare l'aggiornamento del database
async function testDatabaseUpdate() {
  console.log('🚀 Testando aggiornamento database con tabella instagram_posts...');
  console.log(`🌐 API URL: ${RAILWAY_URL}/api/process-instagram-webhook`);
  console.log(`📊 Post da testare: ${testPosts.length}\n`);
  
  const startTime = Date.now();
  
  const options = {
    hostname: RAILWAY_URL.replace('https://', ''),
    port: 443,
    path: '/api/process-instagram-webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    }
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
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log('📋 Risultati del test:');
          console.log(`⏱️  Tempo totale: ${duration}ms`);
          console.log(`📊 Post processati: ${result.processed || result.results?.length || 0}`);
          
          if (result.results && Array.isArray(result.results)) {
            let imageCount = 0;
            let videoCount = 0;
            let databaseUpdates = 0;
            let databaseErrors = 0;
            
            result.results.forEach((post, index) => {
              console.log(`\n📝 [${index + 1}] Post ID: ${post.post_id}`);
              console.log(`   ✅ Successo: ${post.success}`);
              console.log(`   🖼️ Ha immagine: ${post.has_image}`);
              console.log(`   🎵 Ha video: ${post.has_video}`);
              
              if (post.has_image && post.image) {
                imageCount++;
                console.log(`   📏 Dimensione thumb: ${post.image.resizedSize} bytes`);
                console.log(`   📐 Larghezza: ${post.image.width}px`);
                
                if (post.image.supabase && post.image.supabase.success) {
                  console.log(`   ☁️ Supabase URL: ${post.image.supabase.publicUrl}`);
                  
                  if (post.image.database_update) {
                    if (post.image.database_update.success) {
                      databaseUpdates++;
                      console.log(`   ✅ Database aggiornato: ${post.image.database_update.updated_rows} righe`);
                    } else {
                      databaseErrors++;
                      console.log(`   ❌ Errore database: ${post.image.database_update.error}`);
                    }
                  } else {
                    console.log(`   ⚠️ Nessun aggiornamento database`);
                  }
                } else {
                  console.log(`   ❌ Errore Supabase: ${post.image.supabase?.error || 'Non configurato'}`);
                }
              }
              
              if (post.has_video && post.audio) {
                videoCount++;
                console.log(`   🎵 Audio: ${post.audio.audio_size_mb} MB`);
              }
            });
            
            console.log(`\n📊 Statistiche finali:`);
            console.log(`   🖼️ Immagini processate: ${imageCount}`);
            console.log(`   🎵 Video processati: ${videoCount}`);
            console.log(`   ✅ Database aggiornati: ${databaseUpdates}`);
            console.log(`   ❌ Errori database: ${databaseErrors}`);
            
            // Salva i risultati in un file
            const timestamp = Date.now();
            const filename = `database_update_test_results_${timestamp}.json`;
            require('fs').writeFileSync(filename, JSON.stringify(result, null, 2));
            console.log(`\n💾 Risultati salvati in: ${filename}`);
            
          } else {
            console.log('❌ Risposta non valida dal server');
            console.log('Risposta:', result);
          }
          
          resolve(result);
          
        } catch (error) {
          console.error('❌ Errore parsing risposta:', error);
          console.log('Risposta grezza:', responseData);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Errore connessione:', error);
      reject(error);
    });
    
    // Invia i dati
    const postData = JSON.stringify({ posts: testPosts });
    req.write(postData);
    req.end();
  });
}

// Esegui il test
async function runDatabaseUpdateTest() {
  try {
    console.log('🔍 Test aggiornamento database instagram_posts\n');
    
    const result = await testDatabaseUpdate();
    
    console.log('\n🎉 Test completato!');
    console.log('\n💡 Note:');
    console.log('- Il test verifica che le immagini vengano caricate su Supabase Storage');
    console.log('- Controlla che i post_id esistano nella tabella instagram_posts');
    console.log('- Verifica che la colonna "thumbnail" venga aggiornata con gli URL');
    
  } catch (error) {
    console.error('\n❌ Test fallito:', error.message);
  }
}

if (require.main === module) {
  runDatabaseUpdateTest();
}

module.exports = { testDatabaseUpdate }; 