// ============================================
// Routes des utilisateurs (admin)
// Gère le CRUD des comptes utilisateurs
// ============================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
// et un rôle d'administrateur sauf mention contraire
router.use(authenticate);

// GET /api/users - Lister tous les utilisateurs (admin)
router.get('/', authorizeAdmin, userController.getAllUsers);

// GET /api/users/:id - Récupérer un utilisateur (admin)
router.get('/:id', authorizeAdmin, userController.getUser);

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Supprimer un utilisateur (admin)
router.delete('/:id', authorizeAdmin, userController.deleteUser);

module.exports = router;
