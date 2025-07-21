const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// API Key - in produzione dovrebbe essere in variabili d'ambiente
const API_KEY = process.env.API_KEY || 'ffmpeg-secret-key-2024';

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
    endpoints: {
      health: '/api/health (PUBBLICO)',
      ffmpegTest: '/api/ffmpeg-test (PUBBLICO)',
      extractMP3: '/api/extract-mp3 (PROTETTO - Richiede API Key)',
      extractMP3Test: '/api/extract-mp3-test (PROTETTO - Richiede API Key)'
    },
    authentication: {
      method: 'API Key',
      header: 'x-api-key: YOUR_API_KEY',
      alternative: 'Authorization: Bearer YOUR_API_KEY'
    }
  });
});

// Root endpoint (PUBBLICO)
app.get('/', (req, res) => {
  res.json({
    message: 'Instagram Video Processor API - MP3 Extractor (PROTETTO)',
    version: '1.0.0',
    authentication: 'Richiede API Key per gli endpoint protetti',
    endpoints: {
      health: '/api/health (PUBBLICO)',
      ffmpegTest: '/api/ffmpeg-test (PUBBLICO)',
      extractMP3: '/api/extract-mp3 (PROTETTO)',
      extractMP3Test: '/api/extract-mp3-test (PROTETTO)'
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
      }
    }
  });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
  console.log(`🔐 API Key: ${API_KEY}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎬 FFmpeg test: http://localhost:${PORT}/api/ffmpeg-test`);
  console.log(`🎵 MP3 Extractor: POST http://localhost:${PORT}/api/extract-mp3 (Richiede API Key)`);
}); 