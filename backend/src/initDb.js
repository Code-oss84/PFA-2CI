// ============================================
// Script de création des tables (schéma de base de données)
// Exécute les requêtes SQL pour créer toutes les tables
// ============================================

const pool = require('./config/db');

// Requêtes SQL pour créer les tables
// Chaque table représente un modèle métier du projet
const createTableQueries = [
  // Table User : les utilisateurs de l'application
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',           -- 'admin' ou 'user'
    picture TEXT,                               -- Photo de profil
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  // Table Avatar : l'avatar parlant créé par l'utilisateur
  `CREATE TABLE IF NOT EXISTS avatars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    source_image TEXT NOT NULL,                 -- Photo d'origine
    video_url TEXT,                             -- Vidéo générée par SadTalker
    status VARCHAR(20) DEFAULT 'pending',       -- pending, processing, ready, error
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  // Table Course : les cours créés par l'admin
  `CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    level VARCHAR(50) DEFAULT 'beginner',       -- beginner, intermediate, advanced
    category VARCHAR(100),
    image_url TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  // Table Lesson : les leçons associées à un cours
  `CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  // Table Conversation : une session de chat avec l'avatar
  `CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    avatar_id INTEGER REFERENCES avatars(id) ON DELETE SET NULL,
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  // Table Message : les messages d'une conversation
  `CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL,                -- 'user' ou 'avatar'
    content TEXT NOT NULL,
    media_url TEXT,                             -- URL de la vidéo/l'audio
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  // Table Progress : progression de l'utilisateur dans les leçons
  `CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    score INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    UNIQUE(user_id, lesson_id)
  )`,

  // Table Pictogram : pictogrammes ARASAAC pour communication alternative
  `CREATE TABLE IF NOT EXISTS pictograms (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
  )`
];

// Fonction pour exécuter toutes les requêtes de création
async function initDatabase() {
  try {
    console.log('[DB] Initialisation de la base de données...');
    for (const query of createTableQueries) {
      await pool.query(query);
    }
    console.log('[DB] Tables créées avec succès');
  } catch (err) {
    console.error('[DB] Erreur lors de la création des tables:', err.message);
    process.exit(1);
  }
}

// Si exécuté directement (node src/initDb.js), initialise la base
if (require.main === module) {
  initDatabase().then(() => process.exit(0));
}

module.exports = initDatabase;
