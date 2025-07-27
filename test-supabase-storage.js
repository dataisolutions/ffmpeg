const https = require('https');
const fs = require('fs');
const path = require('path');

// Configurazione Supabase Storage
const SUPABASE_URL = 'https://bayjsvnbzomfycypeerx.supabase.co';
const SUPABASE_STORAGE_URL = 'https://bayjsvnbzomfycypeerx.supabase.co/storage/v1';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheWpzdm5iem9tZnljeXBlZXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MzM3NTUsImV4cCI6MjA2OTIxOTc1NX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // Placeholder

// Test image data (base64 encoded small JPEG)
const TEST_IMAGE_BASE64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwA/8AAL/2gAMAwEAAgEDCQA/ABL/2Q==';

// Funzione per testare l'upload su Supabase Storage
async function testSupabaseStorageUpload(filename, imageBuffer) {
  console.log('🧪 Testando upload su Supabase Storage...');
  console.log(`📁 Bucket: thumbnail`);
  console.log(`📄 File: ${filename}`);
  console.log(`📏 Dimensione: ${imageBuffer.length} bytes`);
  console.log(`🌐 Endpoint: ${SUPABASE_STORAGE_URL}`);
  
  const uploadPath = `/storage/v1/object/thumbnail/${filename}`;
  const url = `${SUPABASE_URL}${uploadPath}`;
  
  const options = {
    hostname: 'bayjsvnbzomfycypeerx.supabase.co',
    port: 443,
    path: uploadPath,
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Length': imageBuffer.length,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'x-upsert': 'true' // Sovrascrive se esiste già
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Upload completato con successo!');
            console.log(`🔗 File disponibile su: ${url}`);
            
            resolve({
              success: true,
              statusCode: res.statusCode,
              url: url,
              response: responseData
            });
          } else {
            console.error('❌ Errore durante l\'upload:', res.statusCode);
            console.error('Response:', responseData);
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Errore di connessione:', error);
      reject(error);
    });
    
    req.write(imageBuffer);
    req.end();
  });
}

// Funzione per testare il download da Supabase Storage
async function testSupabaseStorageDownload(filename) {
  console.log('\n📥 Testando download da Supabase Storage...');
  
  const downloadPath = `/storage/v1/object/thumbnail/${filename}`;
  const url = `${SUPABASE_URL}${downloadPath}`;
  
  const options = {
    hostname: 'bayjsvnbzomfycypeerx.supabase.co',
    port: 443,
    path: downloadPath,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📡 Download Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        let imageData = Buffer.alloc(0);
        
        res.on('data', (chunk) => {
          imageData = Buffer.concat([imageData, chunk]);
        });
        
        res.on('end', () => {
          console.log('✅ Download completato con successo!');
          console.log(`📏 Dimensione scaricata: ${imageData.length} bytes`);
          
          // Salva il file localmente per verifica
          const localPath = path.join(__dirname, `downloaded_${filename}`);
          fs.writeFileSync(localPath, imageData);
          console.log(`💾 File salvato localmente: ${localPath}`);
          
          resolve({
            success: true,
            statusCode: res.statusCode,
            size: imageData.length,
            localPath: localPath
          });
        });
      } else {
        let errorData = '';
        res.on('data', (chunk) => {
          errorData += chunk;
        });
        
        res.on('end', () => {
          console.error('❌ Errore durante il download:', res.statusCode);
          console.error('Response:', errorData);
          reject(new Error(`HTTP ${res.statusCode}: ${errorData}`));
        });
      }
    });
    
    req.on('error', (error) => {
      console.error('❌ Errore di connessione per download:', error);
      reject(error);
    });
    
    req.end();
  });
}

// Test completo
async function runSupabaseTest() {
  try {
    console.log('🚀 Iniziando test Supabase Storage...\n');
    console.log(`🔑 API Key utilizzata: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
    console.log(`💡 Per cambiare API key, imposta: SUPABASE_ANON_KEY=la-tua-chiave\n`);
    
    // Crea un buffer di test
    const testImageBuffer = Buffer.from(TEST_IMAGE_BASE64, 'base64');
    const testFilename = 'test_thumbnail.jpg';
    
    console.log('📤 Test 1: Upload immagine...');
    const uploadResult = await testSupabaseStorageUpload(testFilename, testImageBuffer);
    
    if (uploadResult.success) {
      console.log('\n⏳ Attendo 2 secondi prima del download...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('\n📥 Test 2: Download immagine...');
      const downloadResult = await testSupabaseStorageDownload(testFilename);
      
      if (downloadResult.success) {
        console.log('\n🎉 Test Supabase Storage completato con successo!');
        console.log(`📊 Upload: ${uploadResult.statusCode} OK`);
        console.log(`📊 Download: ${downloadResult.statusCode} OK`);
        console.log(`📏 Dimensione originale: ${testImageBuffer.length} bytes`);
        console.log(`📏 Dimensione scaricata: ${downloadResult.size} bytes`);
        console.log(`🔗 URL pubblico: ${uploadResult.url}`);
        
        // Verifica integrità
        if (testImageBuffer.length === downloadResult.size) {
          console.log('✅ Integrità file verificata!');
        } else {
          console.log('⚠️ Attenzione: dimensioni diverse');
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test fallito:', error.message);
    console.error('💡 Verifica:');
    console.error('   - API Key Supabase corretta');
    console.error('   - Bucket "thumbnail" esistente');
    console.error('   - Permessi di scrittura configurati');
  }
}

// Esegui il test se chiamato direttamente
if (require.main === module) {
  runSupabaseTest();
}

module.exports = { 
  testSupabaseStorageUpload, 
  testSupabaseStorageDownload,
  SUPABASE_STORAGE_URL,
  SUPABASE_ANON_KEY
}; 