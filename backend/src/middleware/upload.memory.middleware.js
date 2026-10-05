// ============================================
// Middleware Multer mémoire - Upload audio/audio
// Stocke le fichier en mémoire (Buffer) pour le
// transmettre directement à Whisper sans écriture disque
// ============================================

const multer = require('multer');

// Utilise memoryStorage : les fichiers sont gardés en mémoire
// dans req.file.buffer (pas sur le disque)
const storage = multer.memoryStorage();

// Filtre les types de fichiers audio acceptés
const fileFilter = (req, file, cb) => {
  // Accepte les formats audio courants
  const allowedTypes = [
    'audio/webm',      // Format micro navigateur
    'audio/wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/mp4',
    'audio/x-wav'
  ];

  // Accepte aussi par extension pour plus de tolérance
  const allowedExt = ['webm', 'wav', 'mp3', 'ogg', 'm4a', 'mp4', 'flac'];
  const ext = file.originalname.split('.').pop()?.toLowerCase() || '';

  if (allowedTypes.includes(file.mimetype) || allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format audio non supporté'), false);
  }
};

// Middleware Multer mémoire avec les options configurées
const uploadMemory = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // Limite de 25 Mo pour l'audio
  }
});

module.exports = uploadMemory;