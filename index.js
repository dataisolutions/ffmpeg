const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Test FFmpeg endpoint
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Instagram Video Processor API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      ffmpegTest: '/api/ffmpeg-test'
    }
  });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎬 FFmpeg test: http://localhost:${PORT}/api/ffmpeg-test`);
}); 