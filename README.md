# Instagram Video Processor - MP3 Extractor (PROTETTO)

Un'applicazione Node.js con FFmpeg per estrarre MP3 da video tramite webhook protetto, deployata su Railway.

## 🔐 Autenticazione

L'API richiede un'API key per gli endpoint protetti. La chiave predefinita è: `ffmpeg-secret-key-2024`

**⚠️ IMPORTANTE**: In produzione, cambia l'API key tramite variabile d'ambiente `API_KEY` su Railway.

## 🚀 Deploy su Railway

### Opzione 1: Deploy da GitHub (Raccomandato)

1. **Fai il push su GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TUO_USERNAME/TUO_REPO.git
   git push -u origin main
   ```

2. **Vai su Railway:**
   - Apri [Railway.app](https://railway.app)
   - Clicca "Deploy from GitHub repo"
   - Seleziona il tuo repository
   - Railway rileverà automaticamente il Dockerfile

3. **Configura le variabili d'ambiente:**
   - `NODE_ENV=production`
   - `PORT=3000`
   - `API_KEY=la-tua-chiave-segreta` (OPZIONALE - cambia la chiave predefinita)

### Opzione 2: Deploy con Docker Image

Railway supporterà automaticamente il Dockerfile incluso.

## 🧪 Test dell'installazione

Dopo il deploy, puoi testare che FFmpeg funzioni:

```bash
# Health check (PUBBLICO)
curl https://tuo-app.railway.app/api/health

# Test FFmpeg (PUBBLICO)
curl https://tuo-app.railway.app/api/ffmpeg-test
```

## 🎵 Webhook MP3 Extractor (PROTETTO)

### Endpoint principale
```
POST /api/extract-mp3
```

### Headers richiesti
```
Content-Type: application/json
x-api-key: ffmpeg-secret-key-2024
```

### Body della richiesta
```json
{
  "videoUrl": "https://example.com/video.mp4"
}
```

### Risposta
- **Successo (200)**: File MP3 binario
- **Errore (401)**: API Key mancante
- **Errore (403)**: API Key non valida
- **Errore (400/500)**: JSON con dettagli errore

### Esempio di utilizzo

#### cURL
```bash
curl -X POST https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3 \
  -H "Content-Type: application/json" \
  -H "x-api-key: ffmpeg-secret-key-2024" \
  -d '{"videoUrl": "https://example.com/video.mp4"}' \
  --output extracted.mp3
```

#### JavaScript
```javascript
const response = await fetch('https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'ffmpeg-secret-key-2024'
  },
  body: JSON.stringify({
    videoUrl: 'https://example.com/video.mp4'
  })
});

if (response.ok) {
  const audioBlob = await response.blob();
  // Salva o usa il file MP3
}
```

#### Python
```python
import requests

response = requests.post(
    'https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'ffmpeg-secret-key-2024'
    },
    json={'videoUrl': 'https://example.com/video.mp4'}
)

if response.status_code == 200:
    with open('extracted.mp3', 'wb') as f:
        f.write(response.content)
```

### Test locale
```bash
node test-webhook.js
```

## 📁 Struttura del progetto

```
├── Dockerfile          # Configurazione Docker per Railway
├── package.json        # Dipendenze Node.js
├── index.js           # Server Express con webhook MP3 protetto
├── test-webhook.js    # Script di test per il webhook
├── example-usage.md   # Esempi di utilizzo con autenticazione
├── .dockerignore      # File esclusi dal container
└── README.md          # Questo file
```

## 🔧 Sviluppo locale

```bash
# Installa dipendenze
npm install

# Avvia in modalità sviluppo
npm run dev

# Test FFmpeg
npm test

# Test webhook MP3 (con autenticazione)
node test-webhook.js
```

## 📡 Endpoints API

### Endpoint pubblici (NON richiedono API key)
- `GET /` - Informazioni sull'API
- `GET /api/health` - Health check
- `GET /api/ffmpeg-test` - Test installazione FFmpeg

### Endpoint protetti (Richiedono API key)
- `POST /api/extract-mp3` - Estrai MP3 da URL video
- `GET /api/extract-mp3-test` - Test endpoint (GET)

## 🔒 Sicurezza

- **API Key obbligatoria** per gli endpoint protetti
- **401 Unauthorized**: API key mancante
- **403 Forbidden**: API key non valida
- **Endpoint pubblici** per health check e test FFmpeg
- **Gestione errori** completa con messaggi chiari

## 🐳 Docker

Il progetto include un Dockerfile ottimizzato per Railway che:
- Usa Node.js 18 Alpine (leggero)
- Installa FFmpeg automaticamente
- Configura l'ambiente di produzione
- Gestisce file temporanei
- Supporta variabili d'ambiente per API key

## 📝 Funzionalità

- ✅ **Download video** da URL
- ✅ **Estrazione MP3** con FFmpeg
- ✅ **Autenticazione API key** per sicurezza
- ✅ **Pulizia automatica** file temporanei
- ✅ **Gestione errori** completa
- ✅ **Headers corretti** per download
- ✅ **Supporto HTTPS/HTTP**
- ✅ **Endpoint pubblici** per health check

## 🆘 Troubleshooting

Se FFmpeg non funziona:
1. Controlla i log su Railway
2. Verifica che il Dockerfile sia corretto
3. Testa l'endpoint `/api/ffmpeg-test`

Se l'estrazione MP3 fallisce:
1. Verifica che l'URL del video sia accessibile
2. Controlla che il video abbia traccia audio
3. Verifica i log per errori specifici
4. **Controlla che l'API key sia corretta**

Se ricevi errore 401/403:
1. Verifica che l'header `x-api-key` sia presente
2. Controlla che l'API key sia corretta: `ffmpeg-secret-key-2024`
3. In alternativa usa: `Authorization: Bearer ffmpeg-secret-key-2024`

## 🌐 URL Live

- **App**: https://ffmpeg-production-c6ca.up.railway.app
- **Health**: https://ffmpeg-production-c6ca.up.railway.app/api/health
- **FFmpeg Test**: https://ffmpeg-production-c6ca.up.railway.app/api/ffmpeg-test
- **MP3 Extractor**: POST https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3 (Richiede API Key) 