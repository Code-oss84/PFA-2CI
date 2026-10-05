# ============================================
# Dockerfile - Image du backend Node.js
# Build multi-étapes pour optimiser la taille
# ============================================

# Étape 1 : Installation des dépendances
FROM node:20-alpine AS deps
WORKDIR /app

# Copie uniquement les fichiers de dépendances
# (pour profiter du cache Docker)
COPY package*.json ./

# Installe toutes les dépendances
RUN npm install

# Étape 2 : Application finale
FROM node:20-alpine
WORKDIR /app

# Copie les dépendances installées
COPY --from=deps /app/node_modules ./node_modules
# Copie le code source
COPY . .

# Crée le répertoire des uploads
RUN mkdir -p uploads/avatars uploads/tts uploads/videos

# Port exposé par le conteneur
EXPOSE 3000

# Commande de démarrage
CMD ["node", "src/app.js"]
