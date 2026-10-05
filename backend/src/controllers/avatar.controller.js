// ============================================
// Contrôleur des avatars
// Création d'avatar à partir d'une photo (upload)
// Génération de la vidéo via SadTalker (Colab)
// ============================================

const Avatar = require('../models/Avatar');
const sadtalker = require('../services/sadtalker.service');

// === CRÉER UN AVATAR (avec upload de photo) ===
// POST /api/avatars
exports.createAvatar = async (req, res) => {
  try {
    const { name } = req.body;

    // Vérifie qu'une photo a été uploadée
    if (!req.file) {
      return res.status(400).json({ error: 'Une photo est requise pour créer un avatar' });
    }

    const user_id = req.user.id;
    // Le chemin relatif de la photo pour pouvoir y accéder via l'URL
    const source_image = `/uploads/avatars/${req.file.filename}`;

    // Crée l'avatar avec statut 'pending'
    const avatar = await Avatar.create({ user_id, name, source_image });

    // Lance la génération en arrière-plan (asynchrone)
    // La vidéo sera générée par : Edge TTS (texte -> audio) puis SadTalker (audio -> vidéo)
    if (process.env.SADTALKER_API_URL) {
      // Texte de bienvenue par défaut pour la première vidéo de l'avatar
      const welcomeText = `Bonjour, je suis ${name}, votre assistant pédagogique. Comment puis-je vous aider aujourd'hui ?`;

      sadtalker.generateAvatarWithText(avatar, welcomeText)
        .then((videoUrl) => {
          console.log(`[Avatar ${avatar.id}] Génération terminée: ${videoUrl}`);
          return Avatar.updateVideo(avatar.id, videoUrl, 'ready');
        })
        .catch((err) => {
          console.error(`[Avatar ${avatar.id}] Erreur:`, err.message);
          Avatar.updateStatus(avatar.id, 'error');
        });
    }

    res.status(201).json({ message: 'Avatar créé, génération en cours', avatar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === LISTER LES AVATARS DE L'UTILISATEUR ===
// GET /api/avatars
exports.getUserAvatars = async (req, res) => {
  try {
    const avatars = await Avatar.findByUser(req.user.id);
    res.json({ avatars });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === RÉCUPÉRER UN AVATAR ===
// GET /api/avatars/:id
exports.getAvatar = async (req, res) => {
  try {
    const avatar = await Avatar.findById(req.params.id);
    if (!avatar) {
      return res.status(404).json({ error: 'Avatar introuvable' });
    }

    // Vérifie que l'avatar appartient à l'utilisateur (ou que c'est un admin)
    if (avatar.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json({ avatar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === SUPPRIMER UN AVATAR ===
// DELETE /api/avatars/:id
exports.deleteAvatar = async (req, res) => {
  try {
    const avatar = await Avatar.findById(req.params.id);
    if (!avatar) {
      return res.status(404).json({ error: 'Avatar introuvable' });
    }
    if (avatar.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    await Avatar.delete(req.params.id);
    res.json({ message: 'Avatar supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// === RÉGÉNÉRER LA VIDÉO D'UN AVATAR ===
// POST /api/avatars/:id/generate
exports.generateVideo = async (req, res) => {
  try {
    const avatar = await Avatar.findById(req.params.id);
    if (!avatar) {
      return res.status(404).json({ error: 'Avatar introuvable' });
    }

    // L'utilisateur fournit le texte à prononcer
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Le texte est requis' });
    }

    // Lance la génération en arrière-plan
    Avatar.updateStatus(avatar.id, 'processing');
    sadtalker.generateAvatarWithText(avatar, text)
      .then((videoUrl) => {
        console.log(`[Avatar ${avatar.id}] Vidéo générée:`, videoUrl);
        return Avatar.updateVideo(avatar.id, videoUrl, 'ready');
      })
      .catch((err) => {
        console.error(`[Avatar ${avatar.id}] Erreur:`, err.message);
        Avatar.updateStatus(avatar.id, 'error');
      });

    res.json({ message: 'Génération de la vidéo lancée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
