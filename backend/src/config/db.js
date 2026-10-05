// ============================================
// Connexion à la base de données PostgreSQL
// Utilise le module 'pg' (node-postgres)
// ============================================

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Charge les variables d'environnement depuis le fichier .env
dotenv.config();

// Crée un pool de connexions à PostgreSQL
// Un pool permet de gérer plusieurs connexions simultanées
// au lieu d'ouvrir/fermer une connexion à chaque requête
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'eduvatar',
  password: process.env.DB_PASSWORD || 'eduvatar123',
  database: process.env.DB_NAME || 'eduvatar',
  max: 10, // Nombre maximum de connexions dans le pool
  idleTimeoutMillis: 30000, // Temps d'inactivité avant fermeture
  connectionTimeoutMillis: 2000, // Timeout de connexion
});

// Vérifie la connexion au démarrage
pool.on('connect', () => {
  console.log('[DB] Connexion PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('[DB] Erreur de connexion PostgreSQL:', err.message);
});

// Exporte le pool pour utilisation dans les autres modules
module.exports = pool;
