// ============================================
// Routes des cours
// CRUD des cours (admin) + consultation (user)
// ============================================

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const lessonController = require('../controllers/lesson.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

// GET /api/courses - Liste des cours (tous les utilisateurs)
router.get('/', authenticate, courseController.getAllCourses);

// GET /api/courses/:id - Détail d'un cours avec leçons
router.get('/:id', authenticate, courseController.getCourse);

// POST /api/courses/:courseId/lessons - Créer une leçon (admin)
router.post('/:courseId/lessons', authenticate, authorizeAdmin, lessonController.createLesson);

// POST /api/courses - Créer un cours (admin)
router.post('/', authenticate, authorizeAdmin, courseController.createCourse);

// PUT /api/courses/:id - Mettre à jour un cours (admin)
router.put('/:id', authenticate, authorizeAdmin, courseController.updateCourse);

// DELETE /api/courses/:id - Supprimer un cours (admin)
router.delete('/:id', authenticate, authorizeAdmin, courseController.deleteCourse);

module.exports = router;
