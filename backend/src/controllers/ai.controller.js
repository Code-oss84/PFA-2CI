// ============================================
// Contrôleur AI - Fonctionnalités d'intelligence artificielle
// - Expliquer une leçon via le LLM (Groq)
// - Transcrire l'audio (reconnaissance vocale via Whisper)
//
// Ces endpoints servent à l'assistant pédagogique :
//   POST /api/ai/explain     : l'IA explique une leçon
//   POST /api/ai/transcribe  : micro vocal → texte
//   POST /api/ai/ask         : poser une question à l'IA
// ============================================

const groqService = require('../services/groq.service');
const whisperService = require('../services/whisper.service');
const ttsService = require('../services/tts.service');

// === EXPLIQUER UNE LEÇON ===
// POST /api/ai/explain
// Corps : { lessonTitle, lessonContent, question? }
// L'IA génère une explication pédagogique de la leçon
exports.explainLesson = async (req, res) => {
  try {
    const { lessonTitle, lessonContent, question } = req.body;

    if (!lessonTitle) {
      return res.status(400).json({ error: 'Le titre de la leçon est requis' });
    }

    // Construit la demande d'explication
    // Limite le contenu de la leçon pour accélérer le modèle local
    // (un préfill trop long ralentit nettement Ollama sur CPU)
    const snippet = (lessonContent || '').slice(0, 800);
    let prompt;
    if (question) {
      // L'utilisateur pose une question précise sur la leçon
      prompt = `En te basant sur la leçon "${lessonTitle}", réponds à la question : "${question}". Le contenu de la leçon est : ${snippet || 'Non fourni'}`;
    } else {
      // Explication générale de la leçon
      prompt = `Explique-moi de façon très brève la leçon intitulée "${lessonTitle}" adaptée à un étudiant débutant. Contenu de la leçon : ${snippet || 'Non fourni'}`;
    }

    // Appelle le LLM via le service Groq
    const response = await groqService.generateResponse(prompt, [
      { role: 'system', content: 'Tu es un professeur passionné qui explique à l\'oral. Parle naturellement, en français, avec des exemples concrets du quotidien, sans puces ni titres, comme une vraie explication en classe.' }
    ], 'Professeur');

    res.json({ explanation: response });
  } catch (err) {
    console.error('[AI Explain] Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// === POSER UNE QUESTION À L'IA ===
// POST /api/ai/ask
// Corps : { question }
// L'IA répond à une question libre de l'utilisateur
exports.askQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'La question est requise' });
    }

    const response = await groqService.generateResponse(question, [
      { role: 'system', content: 'Tu es un professeur patient et pédagogique. Tu réponds de manière claire, structurée et encourageante en français.' }
    ], 'Professeur');

    res.json({ answer: response });
  } catch (err) {
    console.error('[AI Ask] Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// === SYNTHÈSE VOCALE (TTS) ===
// POST /api/ai/speak
// Corps : { text }
// Génère un fichier audio (MP3) qui lit le texte à voix haute
// Utilise Microsoft Edge TTS (100% gratuit, sans clé)
exports.speak = async (req, res) => {
  try {
    const { text, voice } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Le texte est requis' });
    }

    // Génère l'audio via Edge TTS
    const audioPath = await ttsService.synthesizeSpeech(text.trim(), voice);

    if (!audioPath) {
      return res.status(500).json({ error: 'Impossible de générer l\'audio, le service TTS n\'est pas disponible' });
    }

    res.json({ audioPath, audioUrl: audioPath });
  } catch (err) {
    console.error('[AI Speak] Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// === SYNTHÈSE VOCALE PAR PHRASES (TTS séquentiel) ===
// POST /api/ai/speak-sentences
// Corps : { text, voice }
// Découpe le texte en phrases et génère UN MP3 PAR phrase
// pour permettre une lecture séquentielle avec des sous-titres
// parfaitement synchronisés (rendu "film").
exports.speakSentences = async (req, res) => {
  try {
    const { text, voice } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Le texte est requis' });
    }

    // Génère un audio par phrase via Edge TTS
    const result = await ttsService.synthesizeSentences(text.trim(), voice);

    if (!result) {
      return res.status(500).json({ error: 'Impossible de générer les sous-titres audio, le service TTS n\'est pas disponible' });
    }

    res.json(result);
  } catch (err) {
    console.error('[AI SpeakSentences] Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// === TRANSCRIRE L'AUDIO (RECONNAISSANCE VOCALE) ===
// POST /api/ai/transcribe
// Multipart : { audio: <fichier audio> }
// Utilise Whisper (Groq / Hugging Face) pour convertir la voix en texte
exports.transcribeAudio = async (req, res) => {
  try {
    // Vérifie qu'un fichier audio a été uploadé
    if (!req.file) {
      return res.status(400).json({ error: 'Un fichier audio est requis' });
    }

    // Vérifie que le service Whisper est configuré
    if (!whisperService.isConfigured()) {
      return res.status(503).json({
        error: 'Le service de reconnaissance vocale n\'est pas configuré. Ajoutez la clé HF_API_KEY dans le .env.'
      });
    }

    // Transcrit l'audio en texte
    // On transmet le nom du fichier d'origine pour l'extension/type MIME
    const text = await whisperService.transcribe(req.file.buffer, req.file.originalname);

    res.json({ text, transcribed: true });
  } catch (err) {
    console.error('[AI Transcribe] Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
};