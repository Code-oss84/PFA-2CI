// ============================================
// Configuration Multer - Gestion des uploads
// Configure l'upload de fichiers (photos d'avatar)
// avec Multer (middleware Express)
// ============================================

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configure le stockage des fichiers uploadés
const storage = multer.diskStorage({
  // Répertoire de destination
  destination: (req, file, cb) => {
    // Les fichiers seront stockés dans uploads/avatars
    cb(null, path.join(__dirname, '..', '..', 'uploads', 'avatars'));
  },
  // Nom de fichier unique
  filename: (req, file, cb) => {
    // Génère un nom aléatoire pour éviter les collisions
    const randomName = crypto.randomBytes(16).toString('hex');
    // Récupère l'extension du fichier d'origine
    const ext = path.extname(file.originalname);
    cb(null, `${randomName}${ext}`);
  }
});

// Filtre les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  // N'accepte que les images
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Utilisez JPEG, PNG, GIF ou WEBP.'), false);
  }
};

// Middleware Multer avec les options configurées
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10 Mo
  }
});

module.exports = upload;
