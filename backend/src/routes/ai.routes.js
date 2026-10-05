// ============================================
// Routes d'IA - Expliquer une leçon et
// reconnaissance vocale (micro)
// ============================================

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const uploadMemory = require('../middleware/upload.memory.middleware');
const { authenticate } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// POST /api/ai/explain - Expliquer une leçon avec l'IA
router.post('/explain', aiController.explainLesson);

// POST /api/ai/ask - Poser une question libre à l'IA
router.post('/ask', aiController.askQuestion);

// POST /api/ai/speak - Synthèse vocale (le texte est lu à voix haute)
router.post('/speak', aiController.speak);

// POST /api/ai/speak-sentences - Synthèse vocale phrase par phrase (sous-titres film)
router.post('/speak-sentences', aiController.speakSentences);

// POST /api/ai/transcribe - Reconnaissance vocale (micro)
// Multipart, champ 'audio'
router.post('/transcribe', uploadMemory.single('audio'), aiController.transcribeAudio);

module.exports = router;