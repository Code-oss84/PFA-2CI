// ============================================
// Routes des statistiques
// Accessibles pour le dashboard
// ============================================

const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/stats - Statistiques globales (admin)
router.get('/', authorizeAdmin, statsController.getGlobalStats);

// GET /api/stats/user - Statistiques de l'utilisateur connecté
router.get('/user', statsController.getUserStats);

// GET /api/stats/by-course - Statistiques par cours (admin)
router.get('/by-course', authorizeAdmin, statsController.getCourseStats);

module.exports = router;
