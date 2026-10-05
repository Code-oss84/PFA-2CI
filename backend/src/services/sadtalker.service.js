// ============================================
// Service SadTalker - Génération d'avatar parlant
// Appelle l'API exposée par le notebook Colab
// officiel via ngrok (gratuit)
//
// Notebook À UTILISER : colab-scripts/SadTalker_API.ipynb
// (clone le repo officiel OpenTalker/SadTalker et
//  appelle la CLI officielle inference.py)
//
// API exposée par le notebook :
//   POST /generate  (multipart : image + audio) → vidéo MP4
//   GET  /health    → vérification
//
// PARAMÈTRE : SADTALKER_API_URL = l'URL ngrok
// ============================================

// Pour les requêtes HTTP (multipart/form-data)
const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const ttsService = require('./tts.service');

class SadTalkerService {
  constructor() {
    // URL de l'API ngrok exposée par Colab
    // Ex: https://xxxx.ngrok-free.app (pas de port en HTTPS ngrok)
    this.apiUrl = (process.env.SADTALKER_API_URL || 'http://localhost:4040').replace(/\/$/, '');
  }

  // Vérifie si le service est configuré
  isConfigured() {
    return Boolean(this.apiUrl) && this.apiUrl !== 'http://localhost:4040';
  }

  // Génère la vidéo de l'avatar parlant
  // @param avatar : l'objet avatar (avec source_image)
  // @param audioPath : le chemin du fichier audio à faire prononcer
  // @returns : l'URL de la vidéo générée (servie par le backend)
  async generateAvatar(avatar, audioPath = null) {
    try {
      if (!this.isConfigured()) {
        throw new Error('[SadTalker] SADTALKER_API_URL non configurée dans le .env');
      }

      // Construit le chemin absolu de l'image source
      const imagePath = path.join(
        __dirname, '..', '..',
        avatar.source_image.replace(/^\/uploads\/?/, 'uploads/')
      );

      if (!fs.existsSync(imagePath)) {
        throw new Error(`[SadTalker] Image introuvable: ${imagePath}`);
      }
      if (!audioPath || !fs.existsSync(audioPath)) {
        throw new Error('[SadTalker] Un fichier audio est requis (Texte TTS manquant)');
      }

      // Prépare le fichier à envoyer (FormData multipart)
      const form = new FormData();
      form.append('image', fs.createReadStream(imagePath));
      form.append('audio', fs.createReadStream(audioPath));

      // Envoie la requête au serveur Colab (notebook SadTalker_API.ipynb)
      const res = await fetch(`${this.apiUrl}/generate`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
        timeout: 600000 // La génération GPU peut prendre plusieurs minutes
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[SadTalker] Erreur:', res.status, errorText.slice(0, 500));
        throw new Error(`[SadTalker] Erreur de génération: ${res.status} - ${errorText.slice(0, 200)}`);
      }

      // La réponse est une vidéo binaire
      const videoBuffer = Buffer.from(await res.arrayBuffer());

      // Sauvegarde la vidéo générée
      const outputDir = path.join(__dirname, '..', '..', 'uploads', 'videos');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const filename = `avatar_${avatar.id}_${Date.now()}.mp4`;
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, videoBuffer);

      // Retourne le chemin accessible via le serveur
      return `/uploads/videos/${filename}`;
    } catch (err) {
      console.error('[SadTalker] Erreur:', err.message);
      throw err;
    }
  }

  // Génère la vidéo à partir d'un TEXTE :
  //   1. Edge TTS (gratuit) convertit le texte en audio
  //   2. SadTalker anime la photo avec cet audio
  async generateAvatarWithText(avatar, text) {
    try {
      // Étape 1 : synthèse vocale GRATUITE (Edge TTS, sans clé API)
      const audioUrl = await ttsService.synthesizeSpeech(text);
      if (!audioUrl) {
        throw new Error('[SadTalker] La synthèse vocale (Edge TTS) a échoué');
      }

      // Chemin absolu du fichier audio généré
      const audioPath = path.join(__dirname, '..', '..', audioUrl.replace(/^\/uploads\/?/, 'uploads/'));
      if (!fs.existsSync(audioPath)) {
        throw new Error(`[SadTalker] Audio TTS introuvable: ${audioPath}`);
      }

      // Étape 2 : génération de la vidéo de l'avatar parlant
      return await this.generateAvatar(avatar, audioPath);
    } catch (err) {
      console.error('[SadTalker] Erreur texte:', err.message);
      throw err;
    }
  }
}

module.exports = new SadTalkerService();
