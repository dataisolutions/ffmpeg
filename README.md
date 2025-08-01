# Instagram Video Processor - MP3 Extractor & Image Resizer (PROTETTO)

Un'applicazione Node.js con FFmpeg per estrarre MP3 da video e ridimensionare immagini tramite webhook protetto, deployata su Railway con integrazione Supabase Storage.

## 🚀 **NUOVO: Risposta Immediata Webhook**

**v2.4.0**: Il webhook Instagram ora risponde **immediatamente** con conferma e processa i contenuti in background per evitare timeout!

### ✅ **Miglioramenti:**
- **Risposta istantanea** (< 100ms)
- **Elaborazione in background** per evitare timeout
- **Conferma immediata** di ricezione
- **Log dettagliati** per monitorare l'avanzamento

## 🔐 Autenticazione Sicura

L'API richiede un'API key per gli endpoint protetti. La chiave è gestita tramite variabile d'ambiente `API_KEY` per massima sicurezza.

**⚠️ IMPORTANTE**: L'API key NON è visibile nel codice sorgente per motivi di sicurezza.

### Configurazione su Railway:
1. Vai su Railway Dashboard
2. Seleziona il tuo progetto `ffmpeg-datai`
3. Vai su "Variables"
4. Aggiungi le variabili d'ambiente:
   - `API_KEY=ARISE100` (OBBLIGATORIO)
   - `SUPABASE_URL=https://bayjsvnbzomfycypeerx.supabase.co` (OPZIONALE)
   - `SUPABASE_ANON_KEY=your_supabase_anon_key` (OPZIONALE - per storage immagini)

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
   - `API_KEY=ARISE100` (OBBLIGATORIO)
   - `SUPABASE_URL=https://bayjsvnbzomfycypeerx.supabase.co` (OPZIONALE)
   - `SUPABASE_ANON_KEY=your_supabase_anon_key` (OPZIONALE - per storage immagini)
   - `NODE_ENV=production` (OPZIONALE)
   - `PORT=3000` (OPZIONALE)

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
x-api-key: ARISE100
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
  -H "x-api-key: ARISE100" \
  -d '{"videoUrl": "https://example.com/video.mp4"}' \
  --output extracted.mp3
```

#### JavaScript
```javascript
const response = await fetch('https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'ARISE100'
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
        'x-api-key': 'ARISE100'
    },
    json={'videoUrl': 'https://example.com/video.mp4'}
)

if response.status_code == 200:
    with open('extracted.mp3', 'wb') as f:
        f.write(response.content)
```

### Test locale
```bash
# Con API key predefinita
node test-webhook.js

# Con API key personalizzata
API_KEY=la-tua-chiave node test-webhook.js
```

## 📱 Webhook Instagram (PROTETTO) - RISPOSTA IMMEDIATA

### Endpoint principale
```
POST /api/process-instagram-webhook
```

### 🚀 **NUOVO: Risposta Immediata**
- **Risposta istantanea** (< 100ms) con conferma di ricezione
- **Elaborazione in background** per evitare timeout
- **Status di elaborazione** disponibile tramite log

### Funzionalità
- **Estrazione MP3**: Da video Instagram (se presenti)
- **Ridimensionamento Immagini**: A 56px di larghezza
- **Upload Supabase Storage**: Salvataggio thumbnail nel bucket "thumbnail"
- **Aggiornamento Database**: Tabella `instagram_posts` con URL thumbnail

### Headers richiesti
```
Content-Type: application/json
x-api-key: ARISE100
```

### Body della richiesta
```json
{
  "posts": [
    {
      "post_id": "123456789",
      "display_url": "https://example.com/image.jpg",
      "video_url": "https://example.com/video.mp4"
    }
  ]
}
```

### Esempio di utilizzo

#### cURL
```bash
curl -X POST https://ffmpeg-production-c6ca.up.railway.app/api/process-instagram-webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: ARISE100" \
  -d '{
    "posts": [
      {
        "post_id": "123456789",
        "display_url": "https://example.com/image.jpg",
        "video_url": "https://example.com/video.mp4"
      }
    ]
  }'
```

#### JavaScript
```javascript
const response = await fetch('https://ffmpeg-production-c6ca.up.railway.app/api/process-instagram-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'ARISE100'
  },
  body: JSON.stringify({
    posts: [
      {
        post_id: '123456789',
        display_url: 'https://example.com/image.jpg',
        video_url: 'https://example.com/video.mp4'
      }
    ]
  })
});

const result = await response.json();
console.log(result);
```

### Risposta (IMMEDIATA)
```json
{
  "success": true,
  "message": "Webhook ricevuto con successo - 2 contenuti in elaborazione",
  "status": "processing",
  "total_posts": 2,
  "posts_to_process": 2,
  "processing_started": "2024-01-15T10:30:00.000Z",
  "note": "I contenuti verranno elaborati in background. Controlla i log per lo stato di avanzamento."
}
```

### 📊 **Monitoraggio Elaborazione**
L'elaborazione avviene in background. Per monitorare lo stato:
- **Controlla i log** su Railway Dashboard
- **Endpoint status**: `GET /api/processing-status` (PUBBLICO)
- **Health check**: `GET /api/health` (PUBBLICO)

## 📁 Struttura del progetto

```
├── Dockerfile                    # Configurazione Docker per Railway
├── package.json                  # Dipendenze Node.js
├── index.js                     # Server Express con webhook MP3 e Instagram
├── instagram-webhook-guide.md   # Guida completa webhook Instagram
├── .dockerignore                # File esclusi dal container
├── .gitignore                   # File esclusi da Git
└── README.md                    # Questo file
```

## 🔧 Sviluppo locale

```bash
# Installa dipendenze
npm install

# Configura variabile d'ambiente
export API_KEY=ARISE100

# Avvia in modalità sviluppo
npm run dev
```

## 🧪 Test

### Test risposta immediata webhook
```bash
# Test risposta immediata
node test-webhook-immediate.js

# Test con API key personalizzata
API_KEY=la-tua-chiave node test-webhook-immediate.js
```

### Test cURL
```bash
# Test risposta immediata
curl -X POST https://ffmpeg-production-c6ca.up.railway.app/api/process-instagram-webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: ARISE100" \
  -d '{
    "posts": [
      {
        "post_id": "test_immediate",
        "display_url": "https://example.com/image.jpg",
        "video_url": "https://example.com/video.mp4"
      }
    ]
  }'
```

## 📡 Endpoints API

### Endpoint pubblici (NON richiedono API key)
- `GET /` - Informazioni sull'API
- `GET /api/health` - Health check
- `GET /api/ffmpeg-test` - Test installazione FFmpeg
- `GET /api/processing-status` - Status elaborazione webhook

### Endpoint protetti (Richiedono API key)
- `POST /api/extract-mp3` - Estrai MP3 da URL video
- `POST /api/process-instagram-webhook` - Processa array di post Instagram (RISPOSTA IMMEDIATA)
- `GET /api/extract-mp3-test` - Test endpoint (GET)

## 🛠️ Tecnologie e Dipendenze

### Core
- **Node.js 18**: Runtime JavaScript
- **Express.js**: Framework web
- **FFmpeg**: Elaborazione video/audio

### Image Processing
- **Sharp**: Ridimensionamento immagini ad alta performance
- **VIPS**: Libreria di sistema per Sharp

### Cloud Storage
- **Supabase**: Database e storage cloud
- **@supabase/supabase-js**: Client JavaScript per Supabase

### Sicurezza
- **CORS**: Gestione cross-origin requests
- **API Key Authentication**: Autenticazione tramite header

## 🔒 Sicurezza Avanzata

- **API Key obbligatoria** per gli endpoint protetti
- **API Key gestita tramite variabile d'ambiente** (non nel codice)
- **Validazione all'avvio** dell'applicazione
- **401 Unauthorized**: API key mancante
- **403 Forbidden**: API key non valida
- **Endpoint pubblici** per health check e test FFmpeg
- **Gestione errori** completa con messaggi chiari
- **Nessuna chiave hardcoded** nel codice sorgente

## 🐳 Docker

Il progetto include un Dockerfile ottimizzato per Railway che:
- Usa Node.js 18 Alpine (leggero)
- Installa FFmpeg automaticamente
- Configura l'ambiente di produzione
- Gestisce file temporanei
- Richiede variabile d'ambiente `API_KEY`

## 📝 Funzionalità

- ✅ **Download video** da URL
- ✅ **Estrazione MP3** con FFmpeg
- ✅ **Autenticazione API key** per sicurezza
- ✅ **Gestione variabile d'ambiente** per API key
- ✅ **Validazione configurazione** all'avvio
- ✅ **Pulizia automatica** file temporanei
- ✅ **Gestione errori** completa
- ✅ **Headers corretti** per download
- ✅ **Supporto HTTPS/HTTP**
- ✅ **Endpoint pubblici** per health check

## 🆘 Troubleshooting

Se l'app non si avvia:
1. **Verifica che la variabile `API_KEY` sia impostata** su Railway
2. Controlla i log su Railway per errori di configurazione
3. Assicurati che il valore sia: `API_KEY=ARISE100`

Se FFmpeg non funziona:
1. Controlla i log su Railway
2. Verifica che il Dockerfile sia corretto
3. Testa l'endpoint `/api/ffmpeg-test` (pubblico)

Se l'estrazione MP3 fallisce:
1. Verifica che l'URL del video sia accessibile
2. Controlla che il video abbia traccia audio
3. Verifica i log per errori specifici
4. **Controlla che l'API key sia corretta**

Se ricevi errore 401/403:
1. Verifica che l'header `x-api-key` sia presente
2. Controlla che l'API key sia corretta: `ARISE100`
3. In alternativa usa: `Authorization: Bearer ARISE100`
4. **Verifica che la variabile d'ambiente sia configurata su Railway**

## 🌐 URL Live

- **App**: https://ffmpeg-production-c6ca.up.railway.app
- **Health**: https://ffmpeg-production-c6ca.up.railway.app/api/health
- **FFmpeg Test**: https://ffmpeg-production-c6ca.up.railway.app/api/ffmpeg-test
- **MP3 Extractor**: POST https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3 (Richiede API Key)

## 🔧 Configurazione Variabili d'Ambiente

### Railway Dashboard:
1. Vai su Railway Dashboard
2. Seleziona il progetto `ffmpeg-datai`
3. Clicca su "Variables"
4. Aggiungi: `API_KEY=ARISE100`

### Locale (.env):
```env
API_KEY=ARISE100
NODE_ENV=development
PORT=3000
```

### Docker:
```bash
docker run -e API_KEY=ARISE100 -p 3000:3000 your-app
``` 