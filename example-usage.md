# Esempi di utilizzo dell'API MP3 Extractor

## 🔐 Autenticazione

L'API richiede un'API key per gli endpoint protetti. La chiave predefinita è: `ffmpeg-secret-key-2024`

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
  -H "x-api-key: ffmpeg-secret-key-2024" \
  -d '{"videoUrl": "https://example.com/video.mp4"}' \
  --output extracted.mp3
```

### JavaScript

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
        'x-api-key': 'ffmpeg-secret-key-2024'
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
    'x-api-key: ffmpeg-secret-key-2024'
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

- L'API key è obbligatoria per gli endpoint protetti
- Senza API key riceverai errore 401 (Unauthorized)
- Con API key sbagliata riceverai errore 403 (Forbidden)
- Gli endpoint pubblici non richiedono autenticazione

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
node test-webhook.js
```

## 🌐 URL Live

- **App**: https://ffmpeg-production-c6ca.up.railway.app
- **Health**: https://ffmpeg-production-c6ca.up.railway.app/api/health
- **FFmpeg Test**: https://ffmpeg-production-c6ca.up.railway.app/api/ffmpeg-test 