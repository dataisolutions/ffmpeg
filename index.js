const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// API Key - SOLO da variabile d'ambiente per sicurezza
const API_KEY = process.env.API_KEY;

// Verifica che l'API key sia impostata
if (!API_KEY) {
  console.error('❌ ERRORE: Variabile d\'ambiente API_KEY non impostata!');
  console.error('🔐 Imposta la variabile API_KEY su Railway o nel file .env');
  console.error('💡 Esempio: API_KEY=ARISE100');
  process.exit(1);
}

console.log('🔐 API Key configurata correttamente');

// Configurazione Supabase Storage
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bayjsvnbzomfycypeerx.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.warn('⚠️ ATTENZIONE: Variabile SUPABASE_ANON_KEY non impostata - Storage immagini disabilitato');
  console.warn('💡 Per abilitare il salvataggio immagini, imposta SUPABASE_ANON_KEY');
} else {
  console.log('☁️ Supabase Storage configurato correttamente');
}

// Inizializza client Supabase
const supabase = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Middleware per verificare API key
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key mancante',
      message: 'Fornisci l\'API key negli headers: x-api-key o Authorization: Bearer YOUR_KEY'
    });
  }
  
  if (apiKey !== API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'API Key non valida',
      message: 'L\'API key fornita non è corretta'
    });
  }
  
  next();
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Crea directory per i file temporanei
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Funzione per scaricare file da URL
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const file = fs.createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Elimina file parziale
        reject(err);
      });
    }).on('error', reject);
  });
}

// Funzione per estrarre MP3 da video
function extractMP3(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i "${videoPath}" -vn -acodec mp3 -ab 192k -ar 44100 -y "${audioPath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(audioPath);
    });
  });
}

// Funzione per scaricare e ridimensionare immagine
async function downloadAndResizeImage(imageUrl, outputPath, targetWidth = 56) {
  try {
    // Step 1: Scarica l'immagine
    const imageBuffer = await downloadImageBuffer(imageUrl);
    
    // Step 2: Ridimensiona l'immagine
    const resizedBuffer = await sharp(imageBuffer)
      .resize(targetWidth, null, { // larghezza 56px, altezza automatica
        withoutEnlargement: true, // non ingrandire se l'immagine è già più piccola
        fit: 'inside' // mantiene le proporzioni
      })
      .jpeg({ quality: 85 }) // formato JPEG con qualità 85%
      .toBuffer();
    
    // Step 3: Salva l'immagine ridimensionata
    fs.writeFileSync(outputPath, resizedBuffer);
    
    return {
      success: true,
      originalSize: imageBuffer.length,
      resizedSize: resizedBuffer.length,
      width: targetWidth,
      height: null // sarà calcolata automaticamente
    };
    
  } catch (error) {
    throw new Error(`Errore nel processing dell'immagine: ${error.message}`);
  }
}

// Funzione per scaricare immagine come buffer
function downloadImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      const chunks = [];
      
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Funzioni per Supabase Storage
async function uploadImageToSupabase(imageBuffer, filename) {
  if (!supabase) {
    throw new Error('Supabase non configurato - imposta SUPABASE_ANON_KEY');
  }
  
  try {
    console.log(`☁️ [Supabase] Uploading ${filename} (${imageBuffer.length} bytes)...`);
    
    const { data, error } = await supabase.storage
      .from('thumbnail')
      .upload(filename, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }
    
    // Genera URL pubblico
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnail')
      .getPublicUrl(filename);
    
    console.log(`✅ [Supabase] Upload completato: ${publicUrl}`);
    
    return {
      success: true,
      filename: filename,
      publicUrl: publicUrl,
      size: imageBuffer.length
    };
    
  } catch (error) {
    console.error(`❌ [Supabase] Errore upload:`, error.message);
    throw error;
  }
}

async function deleteImageFromSupabase(filename) {
  if (!supabase) {
    return; // Non fare nulla se Supabase non è configurato
  }
  
  try {
    console.log(`🗑️ [Supabase] Eliminando ${filename}...`);
    
    const { error } = await supabase.storage
      .from('thumbnail')
      .remove([filename]);
    
    if (error) {
      console.warn(`⚠️ [Supabase] Errore eliminazione: ${error.message}`);
    } else {
      console.log(`✅ [Supabase] File eliminato: ${filename}`);
    }
    
  } catch (error) {
    console.warn(`⚠️ [Supabase] Errore eliminazione: ${error.message}`);
  }
}

// Funzione per aggiornare la tabella instagram_posts con l'URL del thumbnail
async function updateInstagramPostThumbnail(postId, thumbnailUrl) {
  if (!supabase) {
    throw new Error('Supabase non configurato - imposta SUPABASE_ANON_KEY');
  }
  
  try {
    console.log(`📝 [Supabase] Aggiornando thumbnail per post_id: ${postId}`);
    
    const { data, error } = await supabase
      .from('instagram_posts')
      .update({ thumbnail: thumbnailUrl })
      .eq('post_id', postId)
      .select();
    
    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }
    
    if (data && data.length > 0) {
      console.log(`✅ [Supabase] Thumbnail aggiornato per post_id: ${postId}`);
      return {
        success: true,
        post_id: postId,
        thumbnail: thumbnailUrl,
        updated_rows: data.length
      };
    } else {
      console.warn(`⚠️ [Supabase] Nessun record trovato per post_id: ${postId}`);
      return {
        success: false,
        post_id: postId,
        error: 'Record non trovato'
      };
    }
    
  } catch (error) {
    console.error(`❌ [Supabase] Errore aggiornamento thumbnail:`, error.message);
    throw error;
  }
}

// Webhook per estrarre MP3 da URL video (PROTETTO)
app.post('/api/extract-mp3', authenticateApiKey, async (req, res) => {
  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'URL del video richiesto',
        message: 'Fornisci videoUrl nel body della richiesta'
      });
    }
    
    console.log(`🎬 Inizio estrazione MP3 da: ${videoUrl}`);
    
    // Genera nomi file unici
    const timestamp = Date.now();
    const videoPath = path.join(tempDir, `video_${timestamp}.mp4`);
    const audioPath = path.join(tempDir, `audio_${timestamp}.mp3`);
    
    // Step 1: Scarica il video
    console.log('📥 Scaricando video...');
    await downloadFile(videoUrl, videoPath);
    console.log('✅ Video scaricato');
    
    // Step 2: Estrai MP3
    console.log('🎵 Estraendo MP3...');
    await extractMP3(videoPath, audioPath);
    console.log('✅ MP3 estratto');
    
    // Step 3: Leggi il file MP3 e invialo
    const audioBuffer = fs.readFileSync(audioPath);
    
    // Step 4: Pulisci i file temporanei
    fs.unlinkSync(videoPath);
    fs.unlinkSync(audioPath);
    
    // Step 5: Invia il file MP3
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="extracted_${timestamp}.mp3"`);
    res.setHeader('Content-Length', audioBuffer.length);
    
    res.send(audioBuffer);
    
    console.log('🎉 MP3 inviato con successo');
    
  } catch (error) {
    console.error('❌ Errore durante l\'estrazione:', error);
    
    // Pulisci file temporanei in caso di errore
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    } catch (cleanupError) {
      console.error('Errore durante la pulizia:', cleanupError);
    }
    
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'estrazione MP3',
      details: error.message
    });
  }
});

// Endpoint per testare l'estrazione (GET per facilità di test) - PROTETTO
app.get('/api/extract-mp3-test', authenticateApiKey, async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Parametro URL richiesto',
      message: 'Usa: /api/extract-mp3-test?url=URL_DEL_VIDEO'
    });
  }
  
  // Reindirizza alla POST
  res.json({
    success: false,
    message: 'Usa POST /api/extract-mp3 con body: { "videoUrl": "URL_DEL_VIDEO" }',
    example: {
      method: 'POST',
      url: '/api/extract-mp3',
      body: { videoUrl: url }
    }
  });
});

// Webhook per processare array JSON di contenuti Instagram (PROTETTO)
app.post('/api/process-instagram-webhook', authenticateApiKey, async (req, res) => {
  try {
    const { posts } = req.body;
    
    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({
        success: false,
        error: 'Formato JSON non valido',
        message: 'Il body deve contenere un array "posts" con i contenuti Instagram'
      });
    }
    
    console.log(`📦 Ricevuto webhook con ${posts.length} contenuti Instagram`);
    
    // Processa tutti i post (video e immagini)
    const postsToProcess = posts.filter(post => 
      (post.video_url && post.video_url.trim() !== '') || 
      (post.display_url && post.display_url.trim() !== '')
    );
    
    if (postsToProcess.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nessun contenuto trovato da processare',
        processed: 0,
        results: []
      });
    }
    
    console.log(`📦 Trovati ${postsToProcess.length} post da processare`);
    
    const results = [];
    const processedFiles = [];
    
    // Processa ogni post sequenzialmente per evitare sovraccarichi
    for (let i = 0; i < postsToProcess.length; i++) {
      const post = postsToProcess[i];
      const { video_url, post_id, display_url } = post;
      
      console.log(`🎬 [${i + 1}/${postsToProcess.length}] Processando post_id: ${post_id}`);
      
      try {
        // Genera nomi file unici usando post_id
        const timestamp = Date.now();
        const videoPath = path.join(tempDir, `video_${post_id}_${timestamp}.mp4`);
        const audioPath = path.join(tempDir, `audio_${post_id}_${timestamp}.mp3`);
        const finalAudioPath = path.join(tempDir, `${post_id}.mp3`);
        const imagePath = path.join(tempDir, `${post_id}_thumb.jpg`);
        
        let audioResult = null;
        let imageResult = null;
        
        // Step 1: Processa il video (se presente)
        if (video_url && video_url.trim() !== '') {
          console.log(`📥 [${post_id}] Scaricando video...`);
          await downloadFile(video_url, videoPath);
          console.log(`✅ [${post_id}] Video scaricato`);
          
          console.log(`🎵 [${post_id}] Estraendo MP3...`);
          await extractMP3(videoPath, audioPath);
          console.log(`✅ [${post_id}] MP3 estratto`);
          
          // Rinomina il file con post_id
          fs.renameSync(audioPath, finalAudioPath);
          
          // Leggi il file MP3
          const audioBuffer = fs.readFileSync(finalAudioPath);
          
          audioResult = {
            audio_size: audioBuffer.length,
            audio_size_mb: (audioBuffer.length / 1024 / 1024).toFixed(2),
            filename: `${post_id}.mp3`
          };
          
          processedFiles.push({
            post_id: post_id,
            audio_buffer: audioBuffer,
            filename: `${post_id}.mp3`
          });
          
          // Pulisci file video temporanei
          fs.unlinkSync(videoPath);
          fs.unlinkSync(finalAudioPath);
          
          console.log(`🎉 [${post_id}] MP3 processato con successo (${audioResult.audio_size_mb} MB)`);
        }
        
        // Step 2: Processa l'immagine (se presente)
        if (display_url && display_url.trim() !== '') {
          console.log(`🖼️ [${post_id}] Scaricando e ridimensionando immagine...`);
          
          try {
            imageResult = await downloadAndResizeImage(display_url, imagePath, 56);
            
            // Leggi l'immagine ridimensionata
            const imageBuffer = fs.readFileSync(imagePath);
            
            imageResult.filename = `${post_id}_thumb.jpg`;
            imageResult.buffer = imageBuffer;
            
            // Step 2.1: Upload su Supabase Storage (se configurato)
            if (supabase) {
              try {
                const supabaseResult = await uploadImageToSupabase(imageBuffer, `${post_id}_thumb.jpg`);
                imageResult.supabase = supabaseResult;
                console.log(`☁️ [${post_id}] Immagine salvata su Supabase: ${supabaseResult.publicUrl}`);
                
                // Step 2.2: Aggiorna la tabella instagram_posts con l'URL del thumbnail
                try {
                  const updateResult = await updateInstagramPostThumbnail(post_id, supabaseResult.publicUrl);
                  imageResult.database_update = updateResult;
                  console.log(`📝 [${post_id}] Tabella aggiornata: ${updateResult.success ? 'successo' : 'record non trovato'}`);
                } catch (updateError) {
                  console.warn(`⚠️ [${post_id}] Errore aggiornamento tabella:`, updateError.message);
                  imageResult.database_update = { success: false, error: updateError.message };
                }
                
              } catch (supabaseError) {
                console.warn(`⚠️ [${post_id}] Errore upload Supabase:`, supabaseError.message);
                imageResult.supabase = { success: false, error: supabaseError.message };
              }
            } else {
              console.log(`ℹ️ [${post_id}] Supabase non configurato - immagine solo in memoria`);
            }
            
            // Pulisci file immagine temporaneo
            fs.unlinkSync(imagePath);
            
            console.log(`✅ [${post_id}] Immagine ridimensionata (${imageResult.resizedSize} bytes)`);
            
          } catch (imageError) {
            console.warn(`⚠️ [${post_id}] Errore nel processing dell'immagine:`, imageError.message);
            imageResult = { success: false, error: imageError.message };
          }
        }
        
        // Step 3: Aggiungi ai risultati
        results.push({
          post_id: post_id,
          success: true,
          display_url: display_url,
          video_url: video_url,
          audio: audioResult,
          image: imageResult,
          has_video: !!audioResult,
          has_image: !!imageResult
        });
        
        // Pausa tra le elaborazioni per non sovraccaricare
        if (i < postsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ [${post_id}] Errore durante l'elaborazione:`, error.message);
        
        // Pulisci file temporanei in caso di errore
        try {
          if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
          if (fs.existsSync(finalAudioPath)) fs.unlinkSync(finalAudioPath);
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        } catch (cleanupError) {
          console.error(`Errore durante la pulizia per ${post_id}:`, cleanupError);
        }
        
        results.push({
          post_id: post_id,
          success: false,
          display_url: display_url,
          video_url: video_url,
          error: error.message
        });
      }
    }
    
    // Step 7: Crea ZIP con tutti i file MP3 processati
    let zipBuffer = null;
    if (processedFiles.length > 0) {
      console.log(`📦 Creando ZIP con ${processedFiles.length} file MP3...`);
      
      // Per ora restituiamo solo i risultati, il ZIP può essere implementato in seguito
      // se necessario con una libreria come 'archiver'
    }
    
    const successfulResults = results.filter(r => r.success);
    const videoCount = successfulResults.filter(r => r.has_video).length;
    const imageCount = successfulResults.filter(r => r.has_image).length;
    
    console.log(`🎉 Webhook completato: ${successfulResults.length}/${postsToProcess.length} post processati con successo (${videoCount} video, ${imageCount} immagini)`);
    
    res.json({
      success: true,
      message: `Processati ${successfulResults.length}/${postsToProcess.length} post con successo (${videoCount} video, ${imageCount} immagini)`,
      total_posts: posts.length,
      posts_to_process: postsToProcess.length,
      processed: successfulResults.length,
      failed: results.filter(r => !r.success).length,
      video_processed: videoCount,
      images_processed: imageCount,
      results: results,
      files_available: processedFiles.map(f => f.filename)
    });
    
  } catch (error) {
    console.error('❌ Errore durante il processing del webhook:', error);
    
    res.status(500).json({
      success: false,
      error: 'Errore durante il processing del webhook',
      details: error.message
    });
  }
});

// Test FFmpeg endpoint (PUBBLICO)
app.get('/api/ffmpeg-test', (req, res) => {
  exec('ffmpeg -version', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ FFmpeg non è installato:', error);
      return res.status(500).json({
        success: false,
        error: 'FFmpeg non è installato',
        details: error.message
      });
    }
    
    console.log('✅ FFmpeg è installato correttamente!');
    const version = stdout.split('\n')[0];
    
    res.json({
      success: true,
      message: 'FFmpeg è installato correttamente!',
      version: version,
      fullOutput: stdout
    });
  });
});

// Health check endpoint (PUBBLICO)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    authentication: 'API Key configurata tramite variabile d\'ambiente',
    endpoints: {
      health: '/api/health (PUBBLICO)',
      ffmpegTest: '/api/ffmpeg-test (PUBBLICO)',
      extractMP3: '/api/extract-mp3 (PROTETTO - Richiede API Key)',
      extractMP3Test: '/api/extract-mp3-test (PROTETTO - Richiede API Key)',
      instagramWebhook: '/api/process-instagram-webhook (PROTETTO - Richiede API Key)'
    },
    security: {
      method: 'API Key da variabile d\'ambiente',
      header: 'x-api-key: YOUR_API_KEY',
      alternative: 'Authorization: Bearer YOUR_API_KEY',
      note: 'API Key non visibile nel codice sorgente'
    }
  });
});

// Root endpoint (PUBBLICO)
app.get('/', (req, res) => {
  res.json({
    message: 'Instagram Video Processor API - MP3 Extractor & Image Resizer with Supabase Storage & Database Update (PROTETTO)',
    version: '2.3.0',
    authentication: 'Richiede API Key da variabile d\'ambiente per gli endpoint protetti',
    security: 'API Key gestita tramite variabile d\'ambiente API_KEY',
    endpoints: {
      health: '/api/health (PUBBLICO)',
      ffmpegTest: '/api/ffmpeg-test (PUBBLICO)',
      extractMP3: '/api/extract-mp3 (PROTETTO)',
      extractMP3Test: '/api/extract-mp3-test (PROTETTO)',
      instagramWebhook: '/api/process-instagram-webhook (PROTETTO)'
    },
    usage: {
      extractMP3: {
        method: 'POST',
        url: '/api/extract-mp3',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'YOUR_API_KEY'
        },
        body: { videoUrl: 'https://example.com/video.mp4' },
        response: 'MP3 file'
      },
      instagramWebhook: {
        method: 'POST',
        url: '/api/process-instagram-webhook',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'YOUR_API_KEY'
        },
        body: {
          posts: [
            {
              display_url: 'https://example.com/image.jpg',
              post_id: '123456789',
              video_url: 'https://example.com/video.mp4'
            }
          ]
        },
        response: 'JSON con risultati elaborazione'
      }
    },
    setup: {
      note: 'Imposta la variabile d\'ambiente API_KEY su Railway',
      example: 'API_KEY=ARISE100'
    }
  });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
  console.log(`🔐 API Key configurata tramite variabile d'ambiente`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎬 FFmpeg test: http://localhost:${PORT}/api/ffmpeg-test`);
  console.log(`🎵 MP3 Extractor: POST http://localhost:${PORT}/api/extract-mp3 (Richiede API Key)`);
}); 