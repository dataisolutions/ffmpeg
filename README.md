# Instagram Video Processor

Un'applicazione Node.js con FFmpeg per il processing di video, deployata su Railway.

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

3. **Configura le variabili d'ambiente (opzionale):**
   - `NODE_ENV=production`
   - `PORT=3000`

### Opzione 2: Deploy con Docker Image

Railway supporterà automaticamente il Dockerfile incluso.

## 🧪 Test dell'installazione

Dopo il deploy, puoi testare che FFmpeg funzioni:

```bash
# Health check
curl https://tuo-app.railway.app/api/health

# Test FFmpeg
curl https://tuo-app.railway.app/api/ffmpeg-test
```

## 📁 Struttura del progetto

```
├── Dockerfile          # Configurazione Docker per Railway
├── package.json        # Dipendenze Node.js
├── index.js           # Server Express principale
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
```

## 📡 Endpoints API

- `GET /` - Informazioni sull'API
- `GET /api/health` - Health check
- `GET /api/ffmpeg-test` - Test installazione FFmpeg

## 🐳 Docker

Il progetto include un Dockerfile ottimizzato per Railway che:
- Usa Node.js 18 Alpine (leggero)
- Installa FFmpeg automaticamente
- Configura l'ambiente di produzione

## 📝 Note

- FFmpeg viene installato automaticamente nel container Docker
- L'applicazione è configurata per funzionare su Railway
- Include health check e test per FFmpeg
- Supporta CORS per chiamate cross-origin

## 🆘 Troubleshooting

Se FFmpeg non funziona:
1. Controlla i log su Railway
2. Verifica che il Dockerfile sia corretto
3. Testa l'endpoint `/api/ffmpeg-test` 