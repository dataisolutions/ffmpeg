# Esempi di utilizzo dell'API MP3 Extractor

## 🔐 Autenticazione

L'API richiede un'API key per gli endpoint protetti. La chiave deve essere configurata tramite variabile d'ambiente `API_KEY`.

**⚠️ IMPORTANTE**: L'API key NON è visibile nel codice sorgente per motivi di sicurezza.

### Configurazione su Railway:
1. Vai su Railway Dashboard
2. Seleziona il tuo progetto
3. Vai su "Variables"
4. Aggiungi: `API_KEY=ARISE100`

## 📡 Endpoint protetti

- `POST /api/extract-mp3` - Estrai MP3 da URL video
- `GET /api/extract-mp3-test` - Test endpoint

## 📡 Endpoint pubblici

- `GET /api/health` - Health check
- `GET /api/ffmpeg-test` - Test FFmpeg

## 🚀 Esempi di utilizzo

### cURL

```bash
# Estrai MP3 da video
curl -X POST https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3 \
  -H "Content-Type: application/json" \
  -H "x-api-key: ARISE100" \
  -d '{"videoUrl": "https://example.com/video.mp4"}' \
  --output extracted.mp3
```

### JavaScript

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
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'extracted.mp3';
  a.click();
}
```

### Python

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
    print('MP3 estratto con successo!')
else:
    print('Errore:', response.json())
```

### PHP

```php
$url = 'https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3';
$data = ['videoUrl' => 'https://example.com/video.mp4'];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: ARISE100'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    file_put_contents('extracted.mp3', $response);
    echo 'MP3 estratto con successo!';
} else {
    echo 'Errore:', $response;
}
```

## 🔒 Sicurezza

- **API Key obbligatoria** per gli endpoint protetti
- **API Key gestita tramite variabile d'ambiente** (non nel codice)
- **401 Unauthorized**: API key mancante
- **403 Forbidden**: API key non valida
- **Endpoint pubblici** non richiedono autenticazione
- **Nessuna chiave hardcoded** nel codice sorgente

## 📊 Risposte

### Successo (200)
- File MP3 binario
- Headers: `Content-Type: audio/mpeg`
- `Content-Disposition: attachment; filename="extracted_TIMESTAMP.mp3"`

### Errore (400/401/403/500)
```json
{
  "success": false,
  "error": "Descrizione errore",
  "message": "Messaggio dettagliato"
}
```

## 🧪 Test locale

```bash
# Con API key predefinita
node test-webhook.js

# Con API key personalizzata
API_KEY=la-tua-chiave node test-webhook.js
```

## 🌐 URL Live

- **App**: https://ffmpeg-production-c6ca.up.railway.app
- **Health**: https://ffmpeg-production-c6ca.up.railway.app/api/health
- **FFmpeg Test**: https://ffmpeg-production-c6ca.up.railway.app/api/ffmpeg-test

## 🔧 Configurazione

### Variabile d'ambiente richiesta:
```
API_KEY=ARISE100
```

### Dove configurarla:
- **Railway**: Dashboard → Variables → Add Variable
- **Locale**: File `.env` o variabile d'ambiente del sistema
- **Docker**: `-e API_KEY=ARISE100`

### Sicurezza:
- ✅ API Key non visibile nel codice
- ✅ Gestione tramite variabile d'ambiente
- ✅ Validazione all'avvio dell'applicazione
- ✅ Messaggi di errore chiari se non configurata 