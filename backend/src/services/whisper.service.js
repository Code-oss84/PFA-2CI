// ============================================
// Service Whisper - Reconnaissance vocale
// Transcrit l'audio en texte en essayant plusieurs
// fournisseurs dans l'ordre :
//   1. GROQ  (api.groq.com - gratuit, modèle whisper-large-v3-turbo)
//   2. HUGGING FACE (api-inference.huggingface.co - gratuit)
//
// Pourquoi ce choix : selon votre réseau, un des deux
// domaines peut être bloqué. Groq fonctionne ici, donc
// il est tenté en premier.
// ============================================

// Pour les requêtes HTTP
const fetch = require('node-fetch');

class WhisperService {
  constructor() {
    // URL de l'API Groq pour la transcription (OpenAI-compatible)
    this.groqUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
    this.groqModel = process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3';
    this.groqKey = process.env.GROQ_API_KEY;

    // URL de l'API Hugging Face pour le modèle Whisper
    this.hfUrl = `https://api-inference.huggingface.co/models/${process.env.HF_WHISPER_MODEL || 'openai/whisper-large-v3'}`;
    this.hfKey = process.env.HF_API_KEY;
  }

  // Vérifie si au moins un service est configuré
  isConfigured() {
    return Boolean(this.groqKey) || Boolean(this.hfKey);
  }

  // Transcrit un fichier audio en texte
  // @param audioBuffer : le contenu binaire du fichier audio (Buffer)
  // @param originalName : nom du fichier fourni (pour l'extension)
  // @returns : le texte transcrit
  async transcribe(audioBuffer, originalName = 'audio.webm') {
    if (!this.isConfigured()) {
      throw new Error('[Whisper] Aucune clé API de transcription configurée (GROQ_API_KEY ou HF_API_KEY)');
    }

    // 1. Essaie d'abord avec Groq
    if (this.groqKey) {
      try {
        console.log('[Whisper] Tentative via Groq...');
        return await this.transcribeGroq(audioBuffer, originalName);
      } catch (err) {
        console.error('[Whisper] Échec Groq:', err.message);
      }
    }

    // 2. En secours, essaie avec Hugging Face
    if (this.hfKey) {
      try {
        console.log('[Whisper] Tentative via Hugging Face...');
        return await this.transcribeHuggingFace(audioBuffer);
      } catch (err) {
        console.error('[Whisper] Échec Hugging Face:', err.message);
      }
    }

    throw new Error('[Whisper] Tous les fournisseurs de transcription ont échoué');
  }

  // Transcription via l'API Groq (multipart/form-data)
  async transcribeGroq(audioBuffer, originalName) {
    // Utilise multipart/form-data pour envoyer le fichier audio
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', audioBuffer, { filename: originalName, contentType: this.getMimeType(originalName) });
    form.append('model', this.groqModel);
    form.append('language', 'fr'); // Le projet est en français
    form.append('response_format', 'json');

    const res = await fetch(this.groqUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.groqKey}`,
        ...form.getHeaders()
      },
      body: form,
      timeout: 60000
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Whisper/Groq] Erreur API:', res.status, errText);
      throw new Error(`[Whisper/Groq] Erreur ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.text || '';
  }

  // Transcription via l'API Hugging Face (corps binaire)
  async transcribeHuggingFace(audioBuffer) {
    const res = await fetch(this.hfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.hfKey}`,
        'Content-Type': 'audio/wav'
      },
      body: audioBuffer,
      timeout: 120000
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Whisper/HF] Erreur API:', res.status, errorText);
      throw new Error(`[Whisper/HF] Erreur ${res.status}`);
    }

    const data = await res.json();
    return data.text || '';
  }

  // Déduit le type MIME à partir de l'extension du nom de fichier
  getMimeType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || 'webm';
    const map = {
      webm: 'audio/webm',
      wav: 'audio/wav',
      m4a: 'audio/m4a',
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      flac: 'audio/flac'
    };
    return map[ext] || 'audio/webm';
  }
}

module.exports = new WhisperService();
