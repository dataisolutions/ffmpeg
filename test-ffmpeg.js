const { exec } = require('child_process');

console.log('🧪 Testando l\'installazione di FFmpeg...\n');

exec('ffmpeg -version', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ FFmpeg non è installato o non è accessibile');
    console.error('Errore:', error.message);
    process.exit(1);
  }
  
  console.log('✅ FFmpeg è installato correttamente!');
  console.log('📋 Informazioni versione:');
  console.log(stdout);
  
  // Test aggiuntivo per verificare i codec disponibili
  exec('ffmpeg -codecs | head -10', (codecError, codecStdout, codecStderr) => {
    if (!codecError) {
      console.log('\n🎬 Codec disponibili (primi 10):');
      console.log(codecStdout);
    }
    
    console.log('\n🎉 Test completato con successo!');
    console.log('🚀 Il tuo ambiente è pronto per il processing video!');
  });
}); 