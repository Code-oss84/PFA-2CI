// ============================================
// Contrôleur des conversations
// Chat vocal/textuel avec l'avatar
// Intègre le LLM Groq et la synthèse vocale
// ============================================

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Avatar = require('../models/Avatar');
const groqService = require('../services/groq.service');
const ttsService = require('../services/tts.service');

// === CRÉER UNE CONVERSATION ===
// POST /api/conversations
exports.createConversation = async (req, res) => {
  try {
    const { avatar_id, title } = req.body;
    const conversation = await Conversation.create({
      user_id: req.user.id,
      avatar_id,
      title
    });
    res.status(201).json({ conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === LISTER LES CONVERSATIONS DE L'UTILISATEUR ===
// GET /api/conversations
exports.getUserConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findByUser(req.user.id);
    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === RÉCUPÉRER UNE CONVERSATION AVEC SES MESSAGES ===
// GET /api/conversations/:id
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }

    // Vérifie que la conversation appartient à l'utilisateur
    if (conversation.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const messages = await Message.findByConversation(conversation.id);
    res.json({ conversation, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === ENVOYER UN MESSAGE ===
// POST /api/conversations/:id/messages
// Reçoit le message de l'utilisateur, appelle le LLM
// puis la synthèse vocale pour générer la réponse
exports.sendMessage = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { content, useVoice = true } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }
    if (conversation.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Sauvegarde le message de l'utilisateur
    const userMessage = await Message.create({
      conversation_id: conversationId,
      sender: 'user',
      content
    });

    // Appelle le LLM (Groq) pour générer la réponse de l'avatar
    // On passe l'historique récent pour un contexte conversationnel
    const history = await this.getRecentHistory(conversationId, userMessage.id);
    const aiResponse = await groqService.generateResponse(
      content,
      history,
      conversation.title || 'Assistant pédagogique'
    );

    // Prépare la réponse avec un éventuel audio de synthèse
    let mediaUrl = null;
    try {
      // Génère la synthèse vocale de la réponse (Edge TTS, gratuit)
      if (useVoice) {
        mediaUrl = await ttsService.synthesizeSpeech(aiResponse);
      }
    } catch (ttsErr) {
      // Si la TTS échoue, on continue sans audio
      console.error('[TTS] Erreur:', ttsErr.message);
    }

    // Sauvegarde le message de l'avatar
    const aiMessage = await Message.create({
      conversation_id: conversationId,
      sender: 'avatar',
      content: aiResponse,
      media_url: mediaUrl
    });

    res.status(201).json({
      userMessage,
      aiMessage,
      audioUrl: mediaUrl
    });
  } catch (err) {
    console.error('[Chat] Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// === Récupère l'historique récent des messages (contexte pour le LLM) ===
exports.getRecentHistory = async (conversationId, excludeLastId) => {
  try {
    const messages = await Message.findByConversation(conversationId);
    // Exclut le dernier message (celui qu'on vient de créer)
    // et prend les 10 derniers pour le contexte
    const filtered = messages
      .filter(m => m.id !== excludeLastId)
      .slice(-10)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      }));
    return filtered;
  } catch (err) {
    return [];
  }
};

// === SUPPRIMER UNE CONVERSATION ===
// DELETE /api/conversations/:id
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }
    if (conversation.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    await Conversation.delete(req.params.id);
    res.json({ message: 'Conversation supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
