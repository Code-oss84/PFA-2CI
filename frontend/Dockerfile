# ============================================
# Dockerfile - Image du frontend Angular
# Build l'application puis la sert via nginx
# ============================================

# Étape 1 : Build de l'application Angular
FROM node:20-alpine AS build
WORKDIR /app

# Copie les fichiers de configuration
COPY package*.json ./
COPY angular.json ./
COPY tsconfig*.json ./
COPY tailwind.config.js ./
COPY proxy.conf.json ./

# Installe les dépendances
RUN npm install

# Copie le code source
COPY src ./src

# Build de production
RUN npm run build

# Étape 2 : Serveur nginx
FROM nginx:alpine

# Copie le build Angular dans le répertoire servi par nginx
COPY --from=build /app/dist/eduvatar-frontend /usr/share/nginx/html

# Copie la configuration nginx personnalisée
# (proxy pour rediriger les appels /api vers le backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port exposé (80)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
