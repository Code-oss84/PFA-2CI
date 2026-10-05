// ============================================
// Routes d'authentification
// Gère l'inscription, la connexion et le profil
// ============================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// POST /api/auth/register - Inscription
router.post('/register', authController.register);

// POST /api/auth/login - Connexion
router.post('/login', authController.login);

// GET /api/auth/me - Profil actuel (protégé par JWT)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
