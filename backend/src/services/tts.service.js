// ============================================
// Service Text-To-Speech (TTS) - Synthèse vocale
// Utilise Microsoft Edge TTS (100% GRATUIT, sans clé API)
// via le paquet npm "msedge-tts" (implémentation Node pure)
//
// Ce paquet reproduit fidèlement le protocole WebSocket
// de Microsoft Edge Read Aloud et a été validé fonctionnel
// (contrairement à l'ancienne implémentation WebSocket
// maison qui échouait en 1006 sur ce réseau).
//
// Voix françaises disponibles : fr-FR-DeniseNeural (femme),
// fr-FR-HenriNeural (homme), fr-FR-EloiseNeural, etc.
// ============================================

const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');

class EdgeTTSService {
  constructor() {
    // Voix par défaut (français) — voix neurale naturelle de France
    this.voice = process.env.EDGE_TTS_VOICE || 'fr-FR-DeniseNeural';
    // Voix de repli (homme de France)
    this.fallbackVoice = 'fr-FR-HenriNeural';
    // Répertoire de stockage des fichiers audio générés
    this.outputDir = path.join(__dirname, '..', '..', 'uploads', 'tts');
  }

  // Génère un fichier audio (MP3) à partir d'un texte
  // @param text : le texte à prononcer
  // @param voice : la voix à utiliser (optionnel, défaut = Denise)
  // @returns : le chemin servable "/uploads/tts/xxx.mp3" (ou null si échec)
  async synthesizeSpeech(text, voice = this.voice) {
    const safeText = this.cleanForSpeech(String(text || '')).slice(0, 1000);
    if (!safeText.trim()) return null;

    // Voix candidates : celle demandée + les voix de secours françaises
    const candidates = [voice, this.fallbackVoice, 'fr-FR-EloiseNeural']
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    for (const candidate of candidates) {
      const result = await this.trySynthesize(safeText, candidate);
      if (result) return result;
      console.warn(`[TTS] Échec de la voix "${candidate}"`);
    }

    console.error('[TTS] Aucune voix n\'a pu générer l\'audio');
    return null;
  }

  // Récupère le chemin accessible via le serveur pour un texte donné
  // Génère un MP3 PAR PHRASE pour permettre une lecture séquentielle
  // avec des sous-titres parfaitement synchronisés.
  // @param text : le texte à prononcer
  // @param voice : la voix à utiliser (optionnel, défaut = Denise)
  // @returns { phrases, audios } ou null en cas d'échec total.
  async synthesizeSentences(text, voice = this.voice) {
    const safeText = this.cleanForSpeech(String(text || ''));
    if (!safeText.trim()) return null;

    // Découpe en phrases (points, points d'interrogation, exclamation...)
    const sentences = safeText
      .match(/[^.!?;:]+[.!?;:]?/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length === 0) return null;

    // Génère un audio pour chaque phrase via la voix demandée.
    // Génération PARALLÈLE avec une concurrence limitée (max 3 à la fois)
    // pour accélérer le démarrage de la lecture, sans surcharger Edge TTS.
    const audios = await this.generateAudiosConcurrent(sentences, voice);

    // Si aucune phrase n'a pu être synthétisée → échec global
    if (audios.every((a) => !a)) return null;

    return { sentences, audios };
  }

  // Génère les MP3 en parallèle avec un degré de concurrence limité.
  // Chaque échec retombe sur la voix de secours (homme de France).
  async generateAudiosConcurrent(sentences, voice) {
    const audios = new Array(sentences.length); // préserve l'ordre
    const CONCURRENCY = 3; // Edge TTS supporte ~3 requêtes simultanées
    let cursor = 0;

    // Un "worker" pioche la phrase suivante, la synthétise, puis repart.
    const worker = async () => {
      while (cursor < sentences.length) {
        const index = cursor;
        cursor += 1;
        const sentence = sentences[index];
        // Voix principale (timbre constant) avec repli sur la voix de secours
        const result = await this.trySynthesize(sentence, voice)
          || await this.trySynthesize(sentence, this.fallbackVoice);
        audios[index] = result || null;
      }
    };

    // Lance les workers en parallèle, chacun tournant jusqu'à épuisement
    const workers = Array.from({ length: Math.min(CONCURRENCY, sentences.length) }, () => worker());
    await Promise.all(workers);
    return audios;
  }

  // Nettoie le texte du formatage markdown pour la lecture à voix haute
  cleanForSpeech(text) {
    return String(text)
      .replace(/\*\*(.*?)\*\*/g, '$1')   // gras **texte**
      .replace(/\*(.*?)\*/g, '$1 ')      // italique *texte*
      .replace(/`(.*?)`/g, '$1')         // inline code
      .replace(/[*#_~\[\]<>=]+/g, ' ')   // symboles restants (dont * seuls)
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.!?;:])/g, '$1')   // espace avant la ponctuation
      .trim();
  }

  // Tente la synthèse avec une voix donnée
  async trySynthesize(text, voice) {
    const tts = new MsEdgeTTS();
    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      const filename = `tts_${Date.now()}_${Math.round(Math.random() * 1e6)}.mp3`;
      const absolutePath = path.join(this.outputDir, filename);

      const { audioStream } = tts.toStream(text);
      const writeStream = fs.createWriteStream(absolutePath);
      audioStream.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        audioStream.on('error', reject);
      });

      // Vérifie que le fichier est bien présent et non vide
      if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).size === 0) {
        console.warn(`[TTS] Fichier vide pour "${voice}"`);
        return null;
      }

      // Retourne le chemin accessible via le serveur (/uploads servé statiquement)
      return `/uploads/tts/${filename}`;
    } catch (err) {
      console.error(`[TTS] Erreur "${voice}" :`, err.message);
      return null;
    } finally {
      try { tts.close(); } catch (_) {}
    }
  }
}

module.exports = new EdgeTTSService();