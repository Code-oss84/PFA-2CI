// ============================================
// Routes des leçons
// CRUD des leçons (admin) + complétion (user)
// ============================================

const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lesson.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// PUT /api/lessons/:id - Mettre à jour une leçon (admin)
router.put('/:id', authorizeAdmin, lessonController.updateLesson);

// DELETE /api/lessons/:id - Supprimer une leçon (admin)
router.delete('/:id', authorizeAdmin, lessonController.deleteLesson);

// POST /api/lessons/:id/complete - Marquer une leçon comme terminée (user)
router.post('/:id/complete', lessonController.completeLesson);

module.exports = router;
