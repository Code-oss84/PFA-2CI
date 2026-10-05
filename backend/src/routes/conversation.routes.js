// ============================================
// Routes des conversations
// Chat avec l'avatar (textuel et vocal)
// ============================================

const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// POST /api/conversations - Créer une conversation
router.post('/', conversationController.createConversation);

// GET /api/conversations - Liste des conversations de l'utilisateur
router.get('/', conversationController.getUserConversations);

// GET /api/conversations/:id - Récupérer une conversation avec ses messages
router.get('/:id', conversationController.getConversation);

// POST /api/conversations/:id/messages - Envoyer un message (chat avec LLM)
router.post('/:id/messages', conversationController.sendMessage);

// DELETE /api/conversations/:id - Supprimer une conversation
router.delete('/:id', conversationController.deleteConversation);

module.exports = router;
