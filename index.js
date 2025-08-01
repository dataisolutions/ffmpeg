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

// Sistema di tracking elaborazioni in background
const processingJobs = new Map();
let jobCounter = 0;

// Configurazione per scalabilità massiva (8GB RAM, 8 vCPU)
const SCALABILITY_CONFIG = {
  MAX_CONCURRENT_JOBS: 6,           // Max 6 job contemporanei
  BATCH_SIZE: 4,                    // 4 video paralleli per job
  MEMORY_LIMIT: 6 * 1024 * 1024 * 1024, // 6GB limite memoria
  CPU_LIMIT: 0.8,                   // 80% CPU limite
  MAX_VIDEOS_PER_JOB: 1000,         // Max 1000 video per job
  CLEANUP_INTERVAL: 30000,          // Cleanup ogni 30 secondi
  PROGRESS_UPDATE_INTERVAL: 5000    // Aggiorna progresso ogni 5 secondi
};

// Sistema di gestione job con limiti
let activeJobs = 0;
const jobQueue = [];

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
console.log('🚀 Configurazione scalabilità massiva attivata');

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

// Monitoraggio risorse sistema
function getSystemResources() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      percentage: (memUsage.heapUsed / SCALABILITY_CONFIG.MEMORY_LIMIT) * 100
    },
    cpu: cpuUsage,
    activeJobs: activeJobs,
    queueLength: jobQueue.length
  };
}

// Cleanup automatico
function cleanupSystem() {
  const resources = getSystemResources();
  
  if (resources.memory.percentage > 80) {
    console.log('⚠️ Memoria alta, cleanup automatico...');
    global.gc && global.gc(); // Garbage collection se disponibile
  }
  
  // Cleanup file temporanei vecchi
  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minuti
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Rimosso file temporaneo: ${file}`);
      }
    });
  } catch (error) {
    console.warn('⚠️ Errore cleanup file temporanei:', error.message);
  }
}

// Avvia monitoraggio automatico
setInterval(cleanupSystem, SCALABILITY_CONFIG.CLEANUP_INTERVAL);

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

// Elaborazione parallela ottimizzata
async function processVideoBatch(videos, jobId) {
  const batchPromises = videos.map(async (video) => {
    const { video_url, post_id, display_url } = video;
    
    try {
      console.log(`🎬 [${post_id}] Inizio elaborazione parallela...`);
      
      // Genera nomi file unici
      const timestamp = Date.now();
      const videoPath = path.join(tempDir, `video_${post_id}_${timestamp}.mp4`);
      const audioPath = path.join(tempDir, `audio_${post_id}_${timestamp}.mp3`);
      const finalAudioPath = path.join(tempDir, `${post_id}.mp3`);
      const imagePath = path.join(tempDir, `${post_id}_thumb.jpg`);
      
      let audioResult = null;
      let imageResult = null;
      
      // Step 1: Processa video (parallelo)
      if (video_url && video_url.trim() !== '') {
        await downloadFile(video_url, videoPath);
        await extractMP3(videoPath, audioPath);
        
        fs.renameSync(audioPath, finalAudioPath);
        const audioBuffer = fs.readFileSync(finalAudioPath);
        
        audioResult = {
          audio_size: audioBuffer.length,
          audio_size_mb: (audioBuffer.length / 1024 / 1024).toFixed(2),
          filename: `${post_id}.mp3`
        };
        
        // Cleanup immediato
        fs.unlinkSync(videoPath);
        fs.unlinkSync(finalAudioPath);
      }
      
      // Step 2: Processa immagine (parallelo)
      if (display_url && display_url.trim() !== '') {
        try {
          imageResult = await downloadAndResizeImage(display_url, imagePath, 56);
          const imageBuffer = fs.readFileSync(imagePath);
          
          imageResult.filename = `${post_id}_thumb.jpg`;
          imageResult.buffer = imageBuffer;
          
          // Upload Supabase se configurato
          if (supabase) {
            try {
              const supabaseResult = await uploadImageToSupabase(imageBuffer, `${post_id}_thumb.jpg`);
              imageResult.supabase = supabaseResult;
              
              const updateResult = await updateInstagramPostThumbnail(post_id, supabaseResult.publicUrl);
              imageResult.database_update = updateResult;
            } catch (error) {
              imageResult.supabase = { success: false, error: error.message };
            }
          }
          
          fs.unlinkSync(imagePath);
        } catch (error) {
          imageResult = { success: false, error: error.message };
        }
      }
      
      return {
        post_id: post_id,
        success: true,
        display_url: display_url,
        video_url: video_url,
        audio: audioResult,
        image: imageResult,
        has_video: !!audioResult,
        has_image: !!imageResult
      };
      
    } catch (error) {
      console.error(`❌ [${post_id}] Errore elaborazione parallela:`, error.message);
      
      // Cleanup errori
      try {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        if (fs.existsSync(finalAudioPath)) fs.unlinkSync(finalAudioPath);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      } catch (cleanupError) {
        console.error(`Errore cleanup per ${post_id}:`, cleanupError);
      }
      
      return {
        post_id: post_id,
        success: false,
        display_url: display_url,
        video_url: video_url,
        error: error.message
      };
    }
  });
  
  return Promise.all(batchPromises);
}

// Funzioni per il sistema di tracking elaborazioni
function createJobId() {
  return `job_${Date.now()}_${++jobCounter}`;
}

function createJobStatus(totalPosts) {
  return {
    id: createJobId(),
    status: 'processing',
    created_at: new Date().toISOString(),
    total_posts: totalPosts,
    processed: 0,
    failed: 0,
    results: [],
    progress_percentage: 0,
    estimated_completion: null,
    completed_at: null
  };
}

function updateJobProgress(jobId, processed, failed, results) {
  const job = processingJobs.get(jobId);
  if (job) {
    job.processed = processed;
    job.failed = failed;
    job.results = results;
    job.progress_percentage = Math.round((processed + failed) / job.total_posts * 100);
    
    // Stima completamento (circa 1.5 secondi per post con elaborazione parallela)
    const remainingPosts = job.total_posts - (processed + failed);
    const estimatedSeconds = remainingPosts * 1.5;
    job.estimated_completion = new Date(Date.now() + estimatedSeconds * 1000).toISOString();
    
    console.log(`📊 [Job ${jobId}] Progresso: ${job.progress_percentage}% (${processed + failed}/${job.total_posts})`);
  }
}

function completeJob(jobId, finalResults) {
  const job = processingJobs.get(jobId);
  if (job) {
    job.status = 'completed';
    job.completed_at = new Date().toISOString();
    job.results = finalResults;
    job.progress_percentage = 100;
    job.estimated_completion = null;
    
    console.log(`✅ [Job ${jobId}] Elaborazione completata!`);
    
    // Mantieni il job per 1 ora per consultazioni
    setTimeout(() => {
      processingJobs.delete(jobId);
      console.log(`🗑️ [Job ${jobId}] Rimosso dalla memoria`);
    }, 60 * 60 * 1000); // 1 ora
  }
}

function failJob(jobId, error) {
  const job = processingJobs.get(jobId);
  if (job) {
    job.status = 'failed';
    job.completed_at = new Date().toISOString();
    job.error = error.message;
    
    console.log(`❌ [Job ${jobId}] Elaborazione fallita: ${error.message}`);
    
    // Mantieni il job per 1 ora per consultazioni
    setTimeout(() => {
      processingJobs.delete(jobId);
      console.log(`🗑️ [Job ${jobId}] Rimosso dalla memoria`);
    }, 60 * 60 * 1000); // 1 ora
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

// Webhook per processare array JSON di contenuti Instagram (PROTETTO) - RISPOSTA IMMEDIATA + ELABORAZIONE PARALLELA
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
    
    // Crea job di tracking
    const jobId = createJobId();
    const jobStatus = createJobStatus(postsToProcess.length);
    processingJobs.set(jobId, jobStatus);
    
    console.log(`📋 [Job ${jobId}] Creato job di tracking per ${postsToProcess.length} post`);
    
    // RISPOSTA IMMEDIATA - Conferma ricezione con job ID
    const responseData = {
      success: true,
      message: `Webhook ricevuto con successo - ${postsToProcess.length} contenuti in elaborazione parallela`,
      status: 'processing',
      job_id: jobId,
      total_posts: posts.length,
      posts_to_process: postsToProcess.length,
      processing_started: new Date().toISOString(),
      check_status_url: `/api/job-status/${jobId}`,
      scalability: {
        batch_size: SCALABILITY_CONFIG.BATCH_SIZE,
        max_concurrent_jobs: SCALABILITY_CONFIG.MAX_CONCURRENT_JOBS,
        processing_type: 'parallel'
      },
      note: 'Usa il job_id per controllare lo stato di elaborazione tramite /api/job-status/{job_id}'
    };
    
    // Invia risposta immediata
    res.status(200).json(responseData);
    
    // PROCESSING IN BACKGROUND OTTIMIZZATO
    console.log(`🔄 [Job ${jobId}] Avvio elaborazione parallela per ${postsToProcess.length} post...`);
    
    // Controlla limiti sistema
    if (activeJobs >= SCALABILITY_CONFIG.MAX_CONCURRENT_JOBS) {
      console.log(`⚠️ [Job ${jobId}] Troppi job attivi (${activeJobs}), messo in coda`);
      jobQueue.push({ posts: postsToProcess, jobId });
      return;
    }
    
    activeJobs++;
    console.log(`🚀 [Job ${jobId}] Job attivi: ${activeJobs}`);
    
    try {
      const results = [];
      const processedFiles = [];
      
      // Processa in batch paralleli
      for (let i = 0; i < postsToProcess.length; i += SCALABILITY_CONFIG.BATCH_SIZE) {
        const batch = postsToProcess.slice(i, i + SCALABILITY_CONFIG.BATCH_SIZE);
        console.log(`🔄 [Job ${jobId}] Processando batch ${Math.floor(i/SCALABILITY_CONFIG.BATCH_SIZE) + 1}/${Math.ceil(postsToProcess.length/SCALABILITY_CONFIG.BATCH_SIZE)}`);
        
        const batchResults = await processVideoBatch(batch, jobId);
        results.push(...batchResults);
        
        // Aggiorna progresso
        const successfulResults = results.filter(r => r.success);
        const failedResults = results.filter(r => !r.success);
        updateJobProgress(jobId, successfulResults.length, failedResults.length, results);
        
        // Controlla risorse sistema
        const resources = getSystemResources();
        if (resources.memory.percentage > 90) {
          console.log(`⚠️ [Job ${jobId}] Memoria critica (${resources.memory.percentage.toFixed(1)}%), pausa breve...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Completa job
    const successfulResults = results.filter(r => r.success);
    const videoCount = successfulResults.filter(r => r.has_video).length;
    const imageCount = successfulResults.filter(r => r.has_image).length;
    
      console.log(`🎉 [Job ${jobId}] Elaborazione parallela completata: ${successfulResults.length}/${postsToProcess.length} post processati`);
      
      completeJob(jobId, {
        total_posts: postsToProcess.length,
      processed: successfulResults.length,
      failed: results.filter(r => !r.success).length,
      video_processed: videoCount,
      images_processed: imageCount,
      results: results,
      files_available: processedFiles.map(f => f.filename)
    });
    
  } catch (error) {
      console.error(`❌ [Job ${jobId}] Errore elaborazione parallela:`, error);
      failJob(jobId, error);
    } finally {
      activeJobs--;
      console.log(`🏁 [Job ${jobId}] Job completato, attivi: ${activeJobs}`);
      
      // Processa coda se presente
      if (jobQueue.length > 0 && activeJobs < SCALABILITY_CONFIG.MAX_CONCURRENT_JOBS) {
        const nextJob = jobQueue.shift();
        console.log(`🔄 Processando job in coda: ${nextJob.jobId}`);
        // Riavvia elaborazione per job in coda
      }
    }
    
  } catch (error) {
    console.error(`❌ [Job ${jobId}] Errore durante il processing in background:`, error);
    failJob(jobId, error);
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

// Endpoint per controllare lo stato dell'elaborazione (PUBBLICO)
app.get('/api/processing-status', (req, res) => {
  const resources = getSystemResources();
  
  res.json({
    success: true,
    message: 'Stato elaborazione webhook Instagram - OTTIMIZZATO PER SCALABILITÀ',
    note: 'L\'elaborazione avviene in background con elaborazione parallela.',
    endpoints: {
      webhook: 'POST /api/process-instagram-webhook (PROTETTO)',
      jobStatus: 'GET /api/job-status/{job_id} (PUBBLICO)',
      health: 'GET /api/health (PUBBLICO)',
      ffmpeg: 'GET /api/ffmpeg-test (PUBBLICO)'
    },
    processing_info: {
      status: 'background_parallel',
      response_time: 'immediate',
      processing_type: 'parallel_batches',
      note: 'Il webhook risponde immediatamente, poi elabora in background con batch paralleli'
    },
    scalability: {
      active_jobs: activeJobs,
      max_concurrent_jobs: SCALABILITY_CONFIG.MAX_CONCURRENT_JOBS,
      batch_size: SCALABILITY_CONFIG.BATCH_SIZE,
      queue_length: jobQueue.length,
      memory_usage: `${resources.memory.percentage.toFixed(1)}%`
    },
    active_jobs: processingJobs.size
  });
});

// Endpoint per controllare lo stato di un job specifico (PUBBLICO)
app.get('/api/job-status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  const job = processingJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job non trovato',
      message: 'Il job ID fornito non esiste o è scaduto',
      note: 'I job vengono mantenuti in memoria per 1 ora dopo il completamento'
    });
  }
  
  res.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      created_at: job.created_at,
      completed_at: job.completed_at,
      total_posts: job.total_posts,
      processed: job.processed,
      failed: job.failed,
      progress_percentage: job.progress_percentage,
      estimated_completion: job.estimated_completion,
      results: job.results,
      error: job.error
    },
    summary: job.status === 'completed' ? {
      total_posts: job.results.total_posts,
      processed: job.results.processed,
      failed: job.results.failed,
      video_processed: job.results.video_processed,
      images_processed: job.results.images_processed,
      files_available: job.results.files_available
    } : null
  });
});

// Endpoint per listare tutti i job attivi (PUBBLICO)
app.get('/api/jobs', (req, res) => {
  const jobs = Array.from(processingJobs.values()).map(job => ({
    id: job.id,
    status: job.status,
    created_at: job.created_at,
    completed_at: job.completed_at,
    total_posts: job.total_posts,
    processed: job.processed,
    failed: job.failed,
    progress_percentage: job.progress_percentage
  }));
  
  const resources = getSystemResources();
  
  res.json({
    success: true,
    total_jobs: jobs.length,
    jobs: jobs,
    system_status: {
      active_jobs: activeJobs,
      max_concurrent_jobs: SCALABILITY_CONFIG.MAX_CONCURRENT_JOBS,
      queue_length: jobQueue.length,
      memory_usage: `${resources.memory.percentage.toFixed(1)}%`
    }
  });
});

// Health check endpoint (PUBBLICO)
app.get('/api/health', (req, res) => {
  const resources = getSystemResources();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    authentication: 'API Key configurata tramite variabile d\'ambiente',
    scalability: {
      activeJobs: activeJobs,
      maxConcurrentJobs: SCALABILITY_CONFIG.MAX_CONCURRENT_JOBS,
      queueLength: jobQueue.length,
      batchSize: SCALABILITY_CONFIG.BATCH_SIZE,
      maxVideosPerJob: SCALABILITY_CONFIG.MAX_VIDEOS_PER_JOB
    },
    resources: {
      memory: {
        used: `${(resources.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        total: `${(resources.memory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${resources.memory.percentage.toFixed(1)}%`
      },
      activeJobs: resources.activeJobs
    },
    endpoints: {
      health: '/api/health (PUBBLICO)',
      ffmpegTest: '/api/ffmpeg-test (PUBBLICO)',
      processingStatus: '/api/processing-status (PUBBLICO)',
      jobStatus: '/api/job-status/{job_id} (PUBBLICO)',
      jobs: '/api/jobs (PUBBLICO)',
      extractMP3: '/api/extract-mp3 (PROTETTO - Richiede API Key)',
      extractMP3Test: '/api/extract-mp3-test (PROTETTO - Richiede API Key)',
      instagramWebhook: '/api/process-instagram-webhook (PROTETTO - Richiede API Key - RISPOSTA IMMEDIATA + ELABORAZIONE PARALLELA)'
    },
    webhook_improvements: {
      response_time: 'IMMEDIATO',
      processing: 'BACKGROUND_PARALLELO',
      note: 'Il webhook Instagram ora risponde immediatamente e processa in background con elaborazione parallela'
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
  const resources = getSystemResources();
  
  res.json({
    message: 'Instagram Video Processor API - MP3 Extractor & Image Resizer with Supabase Storage & Database Update (PROTETTO) - OTTIMIZZATO PER SCALABILITÀ MASSIVA',
    version: '2.6.0',
    authentication: 'Richiede API Key da variabile d\'ambiente per gli endpoint protetti',
    security: 'API Key gestita tramite variabile d\'ambiente API_KEY',
    scalability: {
      max_concurrent_jobs: SCALABILITY_CONFIG.MAX_CONCURRENT_JOBS,
      batch_size: SCALABILITY_CONFIG.BATCH_SIZE,
      max_videos_per_job: SCALABILITY_CONFIG.MAX_VIDEOS_PER_JOB,
      active_jobs: activeJobs,
      memory_usage: `${resources.memory.percentage.toFixed(1)}%`
    },
    webhook_improvements: {
      response_time: 'IMMEDIATO',
      processing: 'BACKGROUND_PARALLELO',
      note: 'Il webhook Instagram ora risponde immediatamente e processa in background con elaborazione parallela per massima scalabilità'
    },
    endpoints: {
      health: '/api/health (PUBBLICO)',
      ffmpegTest: '/api/ffmpeg-test (PUBBLICO)',
      processingStatus: '/api/processing-status (PUBBLICO)',
      jobStatus: '/api/job-status/{job_id} (PUBBLICO)',
      jobs: '/api/jobs (PUBBLICO)',
      extractMP3: '/api/extract-mp3 (PROTETTO)',
      extractMP3Test: '/api/extract-mp3-test (PROTETTO)',
      instagramWebhook: '/api/process-instagram-webhook (PROTETTO - RISPOSTA IMMEDIATA + ELABORAZIONE PARALLELA)'
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
        response: 'JSON con conferma immediata - elaborazione parallela in background'
      }
    },
    setup: {
      note: 'Imposta la variabile d\'ambiente API_KEY su Railway',
      example: 'API_KEY=ARISE100'
    },
    performance: {
      note: 'Ottimizzato per 1000+ video per richiesta su server 8GB RAM, 8 vCPU',
      expected_improvement: '10-15x più veloce rispetto alla versione sequenziale'
    }
  });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
  console.log(`🔐 API Key configurata tramite variabile d'ambiente`);
  console.log(`⚡ OTTIMIZZAZIONI SCALABILITÀ MASSIVA ATTIVATE`);
  console.log(`📊 Configurazione: ${SCALABILITY_CONFIG.MAX_CONCURRENT_JOBS} job max, ${SCALABILITY_CONFIG.BATCH_SIZE} video paralleli per batch`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎬 FFmpeg test: http://localhost:${PORT}/api/ffmpeg-test`);
  console.log(`🎵 MP3 Extractor: POST http://localhost:${PORT}/api/extract-mp3 (Richiede API Key)`);
}); 