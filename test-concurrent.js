const https = require('https');
const fs = require('fs');

// Configurazione
const RAILWAY_URL = 'https://ffmpeg-production-c6ca.up.railway.app';
const API_KEY = process.env.API_KEY || 'ARISE100';

// URL di test - 3 volte lo stesso video di Instagram
const TEST_VIDEOS = [
  'https://scontent-man2-1.cdninstagram.com/o1/v/t16/f2/m86/AQMg3ji6V4D4fmp1jiRYX1BtiFeY1lZcswWy8y-CTxhwvCfui1YgpB4buxNgKNZXODaC-EWz4hKeAeQeg-0WFXMXp4F9wmi3lwBDN3A.mp4?stp=dst-mp4&efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uY2xpcHMuYzIuNzIwLmJhc2VsaW5lIn0&_nc_cat=110&vs=8299692173488003_2237610040&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC81OTRFQUNCMEM1RTlBNDA5MUVGMTk4MUJBNENEMTdCNV92aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYOnBhc3N0aHJvdWdoX2V2ZXJzdG9yZS9HTkdqM2g2ekZENC1JVFVGQU4zSVYxdUhlQlJVYnFfRUFBQUYVAgLIARIAKAAYABsAFQAAJqSbgensrNQ%2FFQIoAkMzLBdARyPXCj1wpBgSZGFzaF9iYXNlbGluZV8xX3YxEQB1%2Fgdl5p0BAA%3D%3D&_nc_rid=e931542f8d&ccb=9-4&oh=00_AfR-EotaWWHClbA6yRKDWgD6CZ26ma5D9APUiwgT7PsT2g&oe=68881D03&_nc_sid=10d13b',
  'https://scontent-man2-1.cdninstagram.com/o1/v/t16/f2/m86/AQMg3ji6V4D4fmp1jiRYX1BtiFeY1lZcswWy8y-CTxhwvCfui1YgpB4buxNgKNZXODaC-EWz4hKeAeQeg-0WFXMXp4F9wmi3lwBDN3A.mp4?stp=dst-mp4&efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uY2xpcHMuYzIuNzIwLmJhc2VsaW5lIn0&_nc_cat=110&vs=8299692173488003_2237610040&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC81OTRFQUNCMEM1RTlBNDA5MUVGMTk4MUJBNENEMTdCNV92aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYOnBhc3N0aHJvdWdoX2V2ZXJzdG9yZS9HTkdqM2g2ekZENC1JVFVGQU4zSVYxdUhlQlJVYnFfRUFBQUYVAgLIARIAKAAYABsAFQAAJqSbgensrNQ%2FFQIoAkMzLBdARyPXCj1wpBgSZGFzaF9iYXNlbGluZV8xX3YxEQB1%2Fgdl5p0BAA%3D%3D&_nc_rid=e931542f8d&ccb=9-4&oh=00_AfR-EotaWWHClbA6yRKDWgD6CZ26ma5D9APUiwgT7PsT2g&oe=68881D03&_nc_sid=10d13b',
  'https://scontent-man2-1.cdninstagram.com/o1/v/t16/f2/m86/AQMg3ji6V4D4fmp1jiRYX1BtiFeY1lZcswWy8y-CTxhwvCfui1YgpB4buxNgKNZXODaC-EWz4hKeAeQeg-0WFXMXp4F9wmi3lwBDN3A.mp4?stp=dst-mp4&efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uY2xpcHMuYzIuNzIwLmJhc2VsaW5lIn0&_nc_cat=110&vs=8299692173488003_2237610040&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC81OTRFQUNCMEM1RTlBNDA5MUVGMTk4MUJBNENEMTdCNV92aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYOnBhc3N0aHJvdWdoX2V2ZXJzdG9yZS9HTkdqM2g2ekZENC1JVFVGQU4zSVYxdUhlQlJVYnFfRUFBQUYVAgLIARIAKAAYABsAFQAAJqSbgensrNQ%2FFQIoAkMzLBdARyPXCj1wpBgSZGFzaF9iYXNlbGluZV8xX3YxEQB1%2Fgdl5p0BAA%3D%3D&_nc_rid=e931542f8d&ccb=9-4&oh=00_AfR-EotaWWHClbA6yRKDWgD6CZ26ma5D9APUiwgT7PsT2g&oe=68881D03&_nc_sid=10d13b'
];

// Funzione per testare una singola estrazione
async function testSingleExtraction(videoUrl, index) {
  console.log(`🎬 [${index}] Iniziando estrazione: ${videoUrl.substring(0, 50)}...`);
  
  const postData = JSON.stringify({ videoUrl });
  
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
    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        const chunks = [];
        
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const audioBuffer = Buffer.concat(chunks);
          const filename = `concurrent_${index}_${Date.now()}.mp3`;
          
          fs.writeFileSync(filename, audioBuffer);
          
          console.log(`✅ [${index}] Completato in ${duration}ms - ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`);
          
          resolve({
            success: true,
            index,
            duration,
            size: audioBuffer.length,
            filename
          });
        });
      } else {
        let errorData = '';
        res.on('data', (chunk) => {
          errorData += chunk;
        });
        
        res.on('end', () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.error(`❌ [${index}] Errore ${res.statusCode} in ${duration}ms:`, errorData);
          
          reject({
            success: false,
            index,
            duration,
            error: errorData,
            statusCode: res.statusCode
          });
        });
      }
    });
    
    req.on('error', (error) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error(`❌ [${index}] Errore di connessione in ${duration}ms:`, error.message);
      
      reject({
        success: false,
        index,
        duration,
        error: error.message
      });
    });
    
    req.write(postData);
    req.end();
  });
}

// Test di elaborazione simultanea
async function testConcurrentProcessing(concurrency = 3) {
  console.log(`🚀 Test elaborazione simultanea con ${concurrency} richieste concorrenti`);
  console.log(`🔑 API Key: ${API_KEY}`);
  console.log(`🌐 URL: ${RAILWAY_URL}`);
  console.log(`📹 Video da testare: ${TEST_VIDEOS.length}\n`);
  
  const startTime = Date.now();
  const results = [];
  const errors = [];
  
  // Crea batch di richieste simultanee
  for (let i = 0; i < TEST_VIDEOS.length; i += concurrency) {
    const batch = TEST_VIDEOS.slice(i, i + concurrency);
    console.log(`📦 Batch ${Math.floor(i/concurrency) + 1}: ${batch.length} richieste simultanee`);
    
    const batchPromises = batch.map((videoUrl, batchIndex) => {
      const globalIndex = i + batchIndex;
      return testSingleExtraction(videoUrl, globalIndex + 1);
    });
    
    try {
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, batchIndex) => {
        const globalIndex = i + batchIndex;
        
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push({
            index: globalIndex + 1,
            error: result.reason
          });
        }
      });
      
      // Pausa tra i batch per non sovraccaricare
      if (i + concurrency < TEST_VIDEOS.length) {
        console.log(`⏳ Pausa di 2 secondi tra i batch...\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(`❌ Errore nel batch ${Math.floor(i/concurrency) + 1}:`, error);
    }
  }
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  // Risultati finali
  console.log('\n📊 RISULTATI FINALI:');
  console.log('='.repeat(50));
  console.log(`⏱️  Tempo totale: ${totalDuration}ms (${(totalDuration/1000).toFixed(2)}s)`);
  console.log(`✅ Successi: ${results.length}/${TEST_VIDEOS.length}`);
  console.log(`❌ Errori: ${errors.length}/${TEST_VIDEOS.length}`);
  console.log(`🚀 Concorrenza testata: ${concurrency} richieste simultanee`);
  
  if (results.length > 0) {
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const totalSize = results.reduce((sum, r) => sum + r.size, 0);
    
    console.log(`📈 Tempo medio per richiesta: ${avgDuration.toFixed(0)}ms`);
    console.log(`📊 Dimensione totale estratta: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`⚡ Throughput: ${(results.length / (totalDuration/1000)).toFixed(2)} richieste/secondo`);
  }
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORI:');
    errors.forEach(error => {
      console.log(`  - [${error.index}]: ${error.error.error || error.error}`);
    });
  }
  
  console.log('\n💡 RACCOMANDAZIONI:');
  if (errors.length === 0) {
    console.log(`✅ Il server gestisce bene ${concurrency} richieste simultanee`);
    console.log(`🚀 Puoi aumentare la concorrenza a ${concurrency + 2} per testare ulteriormente`);
  } else {
    console.log(`⚠️  Il server ha problemi con ${concurrency} richieste simultanee`);
    console.log(`🔧 Prova a ridurre la concorrenza a ${Math.max(1, concurrency - 1)}`);
  }
  
  return {
    totalDuration,
    successCount: results.length,
    errorCount: errors.length,
    concurrency,
    results,
    errors
  };
}

// Test con diversi livelli di concorrenza
async function runConcurrencyTests() {
  const concurrencyLevels = [1, 2, 3, 5, 10];
  
  console.log('🧪 TEST CAPACITÀ ELABORAZIONE SIMULTANEA');
  console.log('='.repeat(60));
  
  for (const concurrency of concurrencyLevels) {
    console.log(`\n🎯 Test con ${concurrency} richieste simultanee:`);
    console.log('-'.repeat(40));
    
    try {
      const result = await testConcurrentProcessing(concurrency);
      
      if (result.errorCount === 0) {
        console.log(`✅ ${concurrency} richieste simultanee: OK`);
      } else {
        console.log(`⚠️  ${concurrency} richieste simultanee: ${result.errorCount} errori`);
        break; // Ferma se ci sono errori
      }
      
      // Pausa tra i test
      if (concurrency < concurrencyLevels[concurrencyLevels.length - 1]) {
        console.log('⏳ Pausa di 5 secondi prima del prossimo test...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
    } catch (error) {
      console.error(`❌ Test fallito per ${concurrency} richieste simultanee:`, error);
      break;
    }
  }
}

// Esegui il test se chiamato direttamente
if (require.main === module) {
  const concurrency = process.argv[2] ? parseInt(process.argv[2]) : 3;
  
  if (process.argv[3] === '--full') {
    runConcurrencyTests();
  } else {
    testConcurrentProcessing(concurrency);
  }
}

module.exports = { testConcurrentProcessing, runConcurrencyTests }; 