# 🚀 Instagram Webhook API - Guida Completa v2.0

## 📋 Panoramica

Il nuovo endpoint `/api/process-instagram-webhook` permette di processare array di contenuti Instagram in formato JSON, estraendo automaticamente MP3 dai video presenti.

## 🔗 Endpoint

```
POST /api/process-instagram-webhook
```

## 🔐 Autenticazione

Richiede API Key negli headers:
- `x-api-key: ARISE100`
- Oppure: `Authorization: Bearer ARISE100`

## 📥 Struttura Input JSON

```json
{
  "posts": [
    {
      "display_url": "https://example.com/image.jpg",
      "post_id": "123456789",
      "video_url": "https://example.com/video.mp4"
    },
    {
      "display_url": "https://example.com/image2.jpg", 
      "post_id": "987654321",
      "video_url": ""
    }
  ]
}
```

### Campi:
- **`display_url`**: URL dell'immagine del post (opzionale)
- **`post_id`**: ID univoco del post (obbligatorio)
- **`video_url`**: URL del video (se vuoto, il post viene saltato)

## 📤 Struttura Output JSON

```json
{
  "success": true,
  "message": "Processati 2/3 video con successo",
  "total_posts": 3,
  "video_posts": 2,
  "processed": 2,
  "failed": 0,
  "results": [
    {
      "post_id": "123456789",
      "success": true,
      "display_url": "https://example.com/image.jpg",
      "video_url": "https://example.com/video.mp4",
      "audio_size": 1113590,
      "audio_size_mb": "1.06",
      "filename": "123456789.mp3"
    }
  ],
  "files_available": ["123456789.mp3", "987654321.mp3"]
}
```

## 🎯 Funzionalità

### ✅ **Elaborazione Intelligente:**
- Processa solo contenuti con `video_url` presente
- Salta automaticamente immagini e post senza video
- Naming file basato su `post_id`

### 🔄 **Gestione Errori:**
- Elaborazione sequenziale per stabilità
- Pause tra le elaborazioni (1 secondo)
- Pulizia automatica file temporanei
- Report dettagliato successi/errori

### 📊 **Metriche Complete:**
- Numero totale di post ricevuti
- Numero di video trovati
- Numero di elaborazioni riuscite/fallite
- Dimensione file audio generati

## 🧪 Test

### Test Locale:
```bash
# Test con dati di esempio
node test-instagram-webhook.js

# Test con API key personalizzata
API_KEY=la-tua-chiave node test-instagram-webhook.js
```

### Test cURL:
```bash
curl -X POST https://ffmpeg-production-c6ca.up.railway.app/api/process-instagram-webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: ARISE100" \
  -d '{
    "posts": [
      {
        "display_url": "https://example.com/image.jpg",
        "post_id": "test123",
        "video_url": "https://scontent-man2-1.cdninstagram.com/o1/v/t16/f2/m86/AQMg3ji6V4D4fmp1jiRYX1BtiFeY1lZcswWy8y-CTxhwvCfui1YgpB4buxNgKNZXODaC-EWz4hKeAeQeg-0WFXMXp4F9wmi3lwBDN3A.mp4?stp=dst-mp4&efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uY2xpcHMuYzIuNzIwLmJhc2VsaW5lIn0&_nc_cat=110&vs=8299692173488003_2237610040&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC81OTRFQUNCMEM1RTlBNDA5MUVGMTk4MUJBNENEMTdCNV92aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYOnBhc3N0aHJvdWdoX2V2ZXJzdG9yZS9HTkdqM2g2ekZENC1JVFVGQU4zSVYxdUhlQlJVYnFfRUFBQUYVAgLIARIAKAAYABsAFQAAJqSbgensrNQ%2FFQIoAkMzLBdARyPXCj1wpBgSZGFzaF9iYXNlbGluZV8xX3YxEQB1%2Fgdl5p0BAA%3D%3D&_nc_rid=e931542f8d&ccb=9-4&oh=00_AfR-EotaWWHClbA6yRKDWgD6CZ26ma5D9APUiwgT7PsT2g&oe=68881D03&_nc_sid=10d13b"
      }
    ]
  }'
```

## 📝 Esempi di Utilizzo

### JavaScript:
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
        display_url: 'https://example.com/image.jpg',
        post_id: '123456789',
        video_url: 'https://example.com/video.mp4'
      }
    ]
  })
});

const result = await response.json();
console.log(`Processati ${result.processed}/${result.video_posts} video`);
```

### Python:
```python
import requests

response = requests.post(
    'https://ffmpeg-production-c6ca.up.railway.app/api/process-instagram-webhook',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'ARISE100'
    },
    json={
        'posts': [
            {
                'display_url': 'https://example.com/image.jpg',
                'post_id': '123456789',
                'video_url': 'https://example.com/video.mp4'
            }
        ]
    }
)

result = response.json()
print(f"Processati {result['processed']}/{result['video_posts']} video")
```

## 🔧 Configurazione

### Variabili d'Ambiente:
```env
API_KEY=ARISE100
NODE_ENV=production
PORT=3000
```

### Railway:
1. Vai su Railway Dashboard
2. Seleziona il progetto
3. Variables → Add Variable
4. `API_KEY=ARISE100`

## 📊 Performance

### Capacità Testate:
- **✅ 3 richieste simultanee**: Funziona perfettamente
- **⏱️ Tempo medio**: ~2.5 secondi per video
- **📦 Batch processing**: Elaborazione sequenziale per stabilità
- **💾 Dimensione media**: ~1MB per file MP3

### Raccomandazioni:
- **Max 10 post per richiesta** per performance ottimali
- **Pause di 1 secondo** tra elaborazioni automatiche
- **Gestione errori** per ogni singolo post

## 🚨 Gestione Errori

### Codici di Risposta:
- **200**: Successo (anche con alcuni errori)
- **400**: Formato JSON non valido
- **401**: API Key mancante
- **403**: API Key non valida
- **500**: Errore interno del server

### Errori Comuni:
```json
{
  "success": false,
  "error": "Formato JSON non valido",
  "message": "Il body deve contenere un array 'posts' con i contenuti Instagram"
}
```

## 🌐 URL Live

- **App**: https://ffmpeg-production-c6ca.up.railway.app
- **Health Check**: https://ffmpeg-production-c6ca.up.railway.app/api/health
- **Webhook**: POST https://ffmpeg-production-c6ca.up.railway.app/api/process-instagram-webhook

## 📈 Versioni

- **v2.0.0**: Aggiunto webhook Instagram con supporto JSON
- **v1.0.0**: Endpoint singolo per estrazione MP3

## 🔄 Changelog

### v2.0.0 (27 Luglio 2025)
- ✅ Nuovo endpoint `/api/process-instagram-webhook`
- ✅ Supporto per array JSON di contenuti Instagram
- ✅ Elaborazione automatica solo video con `video_url`
- ✅ Naming file basato su `post_id`
- ✅ Report dettagliato elaborazioni
- ✅ Gestione errori per singolo post
- ✅ Test automatici con `test-instagram-webhook.js` 