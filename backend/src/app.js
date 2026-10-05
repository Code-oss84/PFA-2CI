// ============================================
// EduAvatar Backend - Point d'entrée principal
// Configure Express, les routes, le CORS,
// les uploads et démarre le serveur
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Charge les variables d'environnement
dotenv.config();

// === IMPORTATION DES ROUTES ===
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const lessonRoutes = require('./routes/lesson.routes');
const avatarRoutes = require('./routes/avatar.routes');
const conversationRoutes = require('./routes/conversation.routes');
const statsRoutes = require('./routes/stats.routes');
const aiRoutes = require('./routes/ai.routes');

// === IMPORTATION DES MODULES ===
const initDatabase = require('./initDb');

// Crée l'application Express
const app = express();

// === MIDDLEWARES GLOBAUX ===

// Active CORS pour permettre au frontend Angular d'accéder à l'API
// (le frontend tourne sur http://localhost:4200)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));

// Parse les requêtes JSON (pour les body)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sert les fichiers statiques (uploads : photos, vidéos, audio)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// === ROUTES API ===
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai', aiRoutes);

// Route de santé (pour vérifier que l'API fonctionne)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EduAvatar API fonctionne' });
});

// === GESTION DES ERREURS ===

// Middleware pour les routes inconnues (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
  // Gère les erreurs de Multer (upload)
  if (err.message && (err.message.includes('Format de fichier') || err.message.includes('Format audio'))) {
    return res.status(400).json({ error: err.message });
  }
  console.error('[Erreur]', err);
  res.status(500).json({ error: err.message || 'Erreur interne du serveur' });
});

// === DÉMARRAGE DU SERVEUR ===

// Vérifie que le répertoire des uploads existe
const uploadsDir = path.join(__dirname, '..', 'uploads');
['avatars', 'tts', 'videos'].forEach(sub => {
  const dir = path.join(uploadsDir, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Port du serveur
const PORT = process.env.PORT || 3000;

// Initialise la base de données puis démarre le serveur
async function startServer() {
  try {
    // Crée les tables si elles n'existent pas
    await initDatabase();

    // Démarre le serveur
    app.listen(PORT, () => {
      console.log('==========================================');
      console.log(`  EduAvatar Backend démarré`);
      console.log(`  URL: http://localhost:${PORT}`);
      console.log(`  Santé: http://localhost:${PORT}/api/health`);
      console.log('==========================================');
    });
  } catch (err) {
    console.error('Erreur au démarrage:', err.message);
    process.exit(1);
  }
}

startServer();

// Exporte l'app (pour les tests éventuels)
module.exports = app;
