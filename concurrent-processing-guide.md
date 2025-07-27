# Guida Elaborazione Simultanea - Webhook MP3

## 📊 Risultati dei Test

### ✅ **Capacità Confermata:**
- **3 richieste simultanee**: ✅ **FUNZIONA PERFETTAMENTE**
- **5 richieste simultanee**: ⚠️ **PROBLEMI** (1 errore su 3)

### 📈 **Performance con 3 richieste simultanee:**
- **Tempo totale**: 15.43 secondi
- **Tempo medio per richiesta**: 14.82 secondi
- **Throughput**: 0.19 richieste/secondo
- **Dimensione estratta**: 29.00 MB (3 × 9.67 MB)
- **Successi**: 100% (3/3)

### ❌ **Problemi con 5+ richieste:**
- **Errore**: `read ECONNRESET`
- **Causa**: Probabilmente limiti di memoria o CPU su Railway
- **Raccomandazione**: Non superare 3 richieste simultanee

## 🎯 **Raccomandazioni per Produzione**

### **Numero Ottimale di Richieste Simultanee:**
```
✅ RACCOMANDATO: 3 richieste simultanee
⚠️  MASSIMO: 4 richieste simultanee (con cautela)
❌ EVITARE: 5+ richieste simultanee
```

### **Strategia per Elaborare Molti Video:**

#### **Opzione 1: Batch Processing (Raccomandato)**
```javascript
// Elabora 3 video alla volta
const batchSize = 3;
const allVideos = ['url1', 'url2', 'url3', 'url4', 'url5', 'url6', 'url7'];

for (let i = 0; i < allVideos.length; i += batchSize) {
  const batch = allVideos.slice(i, i + batchSize);
  
  // Elabora batch di 3 video simultaneamente
  const promises = batch.map(videoUrl => 
    fetch('https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'ARISE100'
      },
      body: JSON.stringify({ videoUrl })
    })
  );
  
  await Promise.all(promises);
  
  // Pausa tra i batch
  if (i + batchSize < allVideos.length) {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

#### **Opzione 2: Queue Processing**
```javascript
// Coda sequenziale con ritardo
async function processVideoQueue(videoUrls) {
  const results = [];
  
  for (const videoUrl of videoUrls) {
    try {
      const response = await fetch('https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ARISE100'
        },
        body: JSON.stringify({ videoUrl })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        results.push({ success: true, audioBlob });
      } else {
        results.push({ success: false, error: response.status });
      }
      
      // Pausa tra le richieste
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  
  return results;
}
```

## 🚀 **Esempi di Implementazione**

### **Python - Batch Processing**
```python
import asyncio
import aiohttp
import time

async def extract_mp3_batch(video_urls, batch_size=3):
    results = []
    
    for i in range(0, len(video_urls), batch_size):
        batch = video_urls[i:i + batch_size]
        print(f"Elaborando batch {i//batch_size + 1}: {len(batch)} video")
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for video_url in batch:
                task = extract_single_mp3(session, video_url)
                tasks.append(task)
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            results.extend(batch_results)
        
        # Pausa tra i batch
        if i + batch_size < len(video_urls):
            await asyncio.sleep(2)
    
    return results

async def extract_single_mp3(session, video_url):
    try:
        async with session.post(
            'https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3',
            headers={
                'Content-Type': 'application/json',
                'x-api-key': 'ARISE100'
            },
            json={'videoUrl': video_url}
        ) as response:
            if response.status == 200:
                audio_data = await response.read()
                return {'success': True, 'data': audio_data}
            else:
                return {'success': False, 'error': response.status}
    except Exception as e:
        return {'success': False, 'error': str(e)}

# Uso
video_urls = ['url1', 'url2', 'url3', 'url4', 'url5', 'url6']
results = await extract_mp3_batch(video_urls, batch_size=3)
```

### **JavaScript - Queue con Rate Limiting**
```javascript
class MP3Extractor {
  constructor(apiKey, maxConcurrent = 3) {
    this.apiKey = apiKey;
    this.maxConcurrent = maxConcurrent;
    this.queue = [];
    this.running = 0;
  }
  
  async addToQueue(videoUrl) {
    return new Promise((resolve, reject) => {
      this.queue.push({ videoUrl, resolve, reject });
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    this.running++;
    const { videoUrl, resolve, reject } = this.queue.shift();
    
    try {
      const result = await this.extractMP3(videoUrl);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.processQueue();
    }
  }
  
  async extractMP3(videoUrl) {
    const response = await fetch('https://ffmpeg-production-c6ca.up.railway.app/api/extract-mp3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify({ videoUrl })
    });
    
    if (response.ok) {
      return await response.blob();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  }
}

// Uso
const extractor = new MP3Extractor('ARISE100', 3);
const videoUrls = ['url1', 'url2', 'url3', 'url4', 'url5'];

const promises = videoUrls.map(url => extractor.addToQueue(url));
const results = await Promise.all(promises);
```

## 📋 **Best Practices**

### **Per Elaborare Molti Video:**
1. **Usa batch di 3 video** simultaneamente
2. **Aggiungi pause di 2 secondi** tra i batch
3. **Implementa retry logic** per errori temporanei
4. **Monitora i tempi di risposta** per adattare la strategia

### **Monitoraggio:**
- **Tempo medio per richiesta**: ~15 secondi
- **Throughput massimo**: ~0.2 richieste/secondo
- **Memoria per richiesta**: ~10MB (video + MP3)
- **Limite simultaneo**: 3-4 richieste

### **Gestione Errori:**
```javascript
// Retry logic
async function extractWithRetry(videoUrl, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await extractMP3(videoUrl);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Tentativo ${attempt} fallito, riprovo...`);
      await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
    }
  }
}
```

## 🎯 **Conclusione**

Il tuo webhook può elaborare **fino a 3 video simultaneamente** in modo affidabile. Per elaborare molti video, usa la strategia di **batch processing** con pause tra i batch per evitare sovraccarichi. 