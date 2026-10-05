// ============================================
// Routes des avatars
// Création d'avatar avec upload de photo
// ============================================

const express = require('express');
const router = express.Router();
const avatarController = require('../controllers/avatar.controller');
const upload = require('../middleware/upload.middleware');
const { authenticate } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// POST /api/avatars - Créer un avatar (avec upload de photo)
router.post('/', upload.single('image'), avatarController.createAvatar);

// GET /api/avatars - Liste des avatars de l'utilisateur
router.get('/', avatarController.getUserAvatars);

// GET /api/avatars/:id - Récupérer un avatar
router.get('/:id', avatarController.getAvatar);

// POST /api/avatars/:id/generate - Régénérer la vidéo avec un texte
router.post('/:id/generate', avatarController.generateVideo);

// DELETE /api/avatars/:id - Supprimer un avatar
router.delete('/:id', avatarController.deleteAvatar);

module.exports = router;
