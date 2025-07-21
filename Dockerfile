FROM node:18-alpine

# Installa FFmpeg e dipendenze necessarie
RUN apk add --no-cache ffmpeg

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia tutto il codice del progetto
COPY . .

# Esponi la porta
EXPOSE 3000

# Comando per avviare l'applicazione
CMD ["npm", "start"] 