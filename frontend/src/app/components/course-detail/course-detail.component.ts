// ============================================
// CourseDetailComponent - Détail d'un cours
// Affiche les leçons, permet de les marquer comme
// terminées, suit la progression, et propose un
// assistant IA qui explique la leçon + micro vocal
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AiService } from '../../services/ai.service';
import { Course, Lesson } from '../../models/models';

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.css']
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  // Identifiant du cours
  courseId!: number;
  // Détails du cours
  course: Course | null = null;
  // Liste des leçons
  lessons: Lesson[] = [];
  // Leçon actuellement sélectionnée
  currentLesson: Lesson | null = null;
  // Leçon démarrée (le professeur IA ne se lance qu'après "Commencer le cours")
  lessonStarted = false;
  // Progression en pourcentage
  progress = 0;
  // Leçons complétées
  completedLessons = new Set<number>();
  // Sidebar des leçons (ouverte/cachée) en mode Meet
  sidebarOpen = true;
  // Chargement
  loading = true;
  // Erreur
  errorMessage = '';

  // === EXPLICATION IA ===
  // Texte de l'explication générée par l'IA
  aiExplanation = '';
  // Indicateur de génération d'explication
  explaining = false;
  // Message affiché pendant la préparation du cours
  loadingMessage = '';
  // === SYNTHÈSE VOCALE (le texte IA est lu à haute voix) ===
  // Lecture en cours
  speaking = false;
  // Référence au lecteur audio courant
  private currentAudio: HTMLAudioElement | null = null;
  // Phrases restantes à lire (file de synthèse humanisée)
  private currentSentences: string[] = [];
  // Index de la phrase en cours de lecture
  private speechIndex = 0;
  // Minuterie de micro-pause entre deux phrases
  private speechPauseTimer: number | null = null;
  // Les phrases du texte lu (pour les sous-titres synchronisés)
  subtitles: string[] = [];
  // Index de la phrase actuellement dite (sous-titre actif)
  activeSubtitleIndex = -1;
  // Texte en cours de lecture (pour découper les sous-titres)
  private currentSpeakText = '';
  // Voix Edge TTS par défaut (professeur naturel : DeniseNeural)
  private edgeVoice = 'fr-FR-DeniseNeural';
  // Texte de l'explication avant interruption micro (pour reprendre après la question)
  private explanationBeforeMic = '';
  // Position de reprise dans le texte de l'explication (indice de phrase)
  private explanationResumeIndex = 0;
  // Callback exécuté quand la synthèse vocale termine (pour enchaîner)
  private onSpeakingDone: (() => void) | null = null;

  // === QUESTIONS À L'IA ===
  // Question saisie par l'utilisateur
  question = '';
  // Question reconnue par le micro
  recognizedText = '';
  // Réponse de l'IA
  aiAnswer = '';
  // Indicateur de réponse en cours
  asking = false;

  // === MICRO / RECONNAISSANCE VOCALE ===
  // Enregistre si le micro est en cours d'écoute
  isRecording = false;
  // Blob audio enregistré (pour l'API backend Whisper)
  audioBlob: Blob | null = null;
  // Flux du micro (MediaStream)
  private mediaRecorder: MediaRecorder | null = null;
  // Chunks de l'enregistrement audio
  private audioChunks: Blob[] = [];
  // Support de l'API MediaRecorder
  micSupported = typeof window !== 'undefined' && !!window.MediaRecorder;
  // Transcription en cours
  transcribing = false;

  // === RECONNAISSANCE VOCALE LOCALE (WEB SPEECH API) ===
  // Privilégie l'API Web Speech du navigateur (100% local, en français)
  // → pas d'appel réseau, fonctionne même si Hugging Face est bloqué
  // Déclarée via any car le type SpeechRecognition n'est pas standard partout
  private speechRecognition: any = null;
  speechSupported = typeof window !== 'undefined' && !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private aiService: AiService
  ) {}

  ngOnInit(): void {
    // Récupère l'identifiant du cours depuis l'URL
    this.route.params.subscribe((params) => {
      this.courseId = Number(params['id']);
      this.loadCourse();
    });
  }

  ngOnDestroy(): void {
    // Arrête le micro et l'audio si l'utilisateur quitte la page
    this.stopRecording();
    this.stopAudio();
  }

  // Arrête l'audio en cours de lecture (fichier + synthèse locale)
  stopAudio(): void {
    this.stopSpeaking();
  }

  // Charge les détails du cours
  loadCourse(): void {
    this.courseService.getCourse(this.courseId).subscribe({
      next: (res) => {
        this.course = res.course;
        this.lessons = res.lessons;
        this.progress = res.progress || 0;

        // Sélectionne la première leçon par défaut (sans la démarrer)
        // Le professeur ne se lance qu'au clic sur "Commencer le cours".
        if (this.lessons.length > 0) {
          this.currentLesson = this.lessons[0];
          this.lessonStarted = false;
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erreur lors du chargement du cours';
        this.loading = false;
      }
    });
  }

  // Sélectionne une leçon : affiche l'écran d'accueil
  // avec un bouton "Commencer le cours" — l'IA ne se lance pas encore.
  selectLesson(lesson: Lesson): void {
    this.currentLesson = lesson;
    this.lessonStarted = false;
    // Réinitialise l'état de l'IA quand on change de leçon
    this.resetAI();
  }

  // Démarre réellement la leçon : découvre le contenu + lance
  // le professeur IA qui explique et lit le cours à voix haute.
  startLesson(): void {
    if (!this.currentLesson) return;
    this.lessonStarted = true;
    // Le professeur IA explique et lit la leçon
    this.explainLessonAI(true);
  }

  // Marque la leçon courante comme terminée
  completeLesson(): void {
    if (!this.currentLesson) return;

    this.courseService.completeLesson(this.currentLesson.id).subscribe({
      next: (res: any) => {
        // Ajoute la leçon à la liste des terminées
        this.completedLessons.add(this.currentLesson!.id);
        // Met à jour la progression globale
        this.progress = res.coursePercentage || this.progress;
      },
      error: (err: any) => {
        console.error('Erreur complétion:', err);
      }
    });
  }

  // Réinitialise l'état de l'IA
  resetAI(): void {
    this.aiExplanation = '';
    this.aiAnswer = '';
    this.question = '';
    this.recognizedText = '';
    this.stopAudio();
    this.stopRecording();
  }

  // ---------- EXPLICATION DE LA LEÇON PAR L'IA ----------

  // Demande à l'IA d'expliquer la leçon courante
  explainLessonAI(auto = false): void {
    if (!this.currentLesson) return;

    this.explaining = true;
    this.aiExplanation = '';

    // Message de chargement phase 1 : le professeur réfléchit (LLM local)
    this.loadingMessage = 'Le professeur prépare votre leçon...';

    this.aiService.explainLesson(
      this.currentLesson.title,
      this.currentLesson.content
    ).subscribe({
      next: (res) => {
        this.aiExplanation = res.explanation;
        // Phase 2 : le professeur s'apprête à parler (génération de la voix)
        this.loadingMessage = 'Le professeur s\'apprête à parler...';
        // Le professeur IA LIT l'explication à voix haute (synthèse vocale)
        this.speakText(res.explanation);
        // Le chargement reste affiché jusqu'à ce que la VOIX démarre
        this.explaining = false;
      },
      error: (err: any) => {
        console.error('Erreur explication:', err);
        this.explaining = false;
      }
    });
  }

  // ---------- QUESTIONS À L'IA ----------

  // Pose une question (saisie ou vocale) à l'IA
  askAI(): void {
    // Utilise la question saisie, sinon la transcription vocale
    const q = (this.question || this.recognizedText).trim();
    if (!q || this.asking) return;

    this.asking = true;
    this.aiAnswer = '';
    this.question = '';

    this.aiService.askQuestion(q).subscribe({
      next: (res) => {
        this.aiAnswer = res.answer;
        this.asking = false;
        // Le professeur IA LIT la réponse à voix haute,
        // puis quand la réponse est TERMINÉE, reprend l'explication
        this.speakText(res.answer, () => this.resumeExplanationAfterAnswer());
      },
      error: (err: any) => {
        console.error('Erreur réponse IA:', err);
        this.asking = false;
        // En cas d'erreur, reprend l'explication quand même
        this.resumeExplanationAfterAnswer();
      }
    });
  }

  // Reprend la lecture de l'explication après avoir répondu à une question.
  // Reprend à partir de la phrase qui était en cours d'analyse avant l'interruption
  // (on saute les phrases déjà dites pour ne pas répéter).
  private resumeExplanationAfterAnswer(): void {
    const saved = this.explanationBeforeMic;
    const resumeIdx = this.explanationResumeIndex;
    this.explanationBeforeMic = '';
    this.explanationResumeIndex = 0;
    if (!saved) return;

    // Découpe le texte en phrases et reprend à partir de la position sauvegardée
    const sentences = this.splitIntoSentences(this.prepareForSpeech(saved));
    const remaining = sentences.slice(Math.max(resumeIdx, 0)).join(' ');
    if (remaining.trim()) {
      this.aiExplanation = saved; // Restaure l'explication pour les sous-titres
      this.speakText(remaining);
    }
  }

  // ---------- SYNTHÈSE VOCALE (le professeur lit le texte) ----------

  // Support de la synthèse vocale LOCALE du navigateur (speechSynthesis)
  // → 100% local, gratuit, en français, fonctionne même hors-ligne
  // (Chrome, Edge). Prioritaire car il n'y a aucun blocage réseau.
  speechSynthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Lit le texte à voix haute avec des SOUS-TITRES synchronisés (rendu film).
  // 1. PRIVILÉGIE la synthèse PAR PHRASES via le backend Edge TTS :
  //    un MP3 par phrase, joué en séquence, le sous-titre de la phrase en
  //    cours s'affichant en parallèle du son (voix naturelle Denise/Henri).
  // 2. Si le backend échoue, se replie sur la synthèse LOCALE du navigateur.
  // onDone : callback exécuté quand la lecture se termine (optionnel)
  speakText(text: string, onDone?: () => void): void {
    if (!text.trim()) return;
    // Arrête toute lecture en cours
    this.stopSpeaking();
    // Enregistre le callback pour l'exécuter à la fin de la lecture
    this.onSpeakingDone = onDone || null;

    this.synthesizeBackendSentences(text);
  }

  // Synthèse backend PAR PHRASES : génère un MP3 pour chaque phrase,
  // puis les lit en séquence en synchronisant les sous-titres au son.
  private synthesizeBackendSentences(text: string): void {
    const cleanText = this.prepareForSpeech(text);
    this.currentSpeakText = cleanText;
    this.speaking = true;

    this.aiService.speakSentences(cleanText, this.edgeVoice).subscribe({
      next: (res) => {
        if (!res.sentences || res.sentences.length === 0) {
          this.speaking = false;
          return;
        }
        // Prépare les sous-titres
        this.subtitles = res.sentences;
        this.activeSubtitleIndex = -1;
        // Joue les phrases en séquence
        this.playSentencesSequentially(res.audios);
      },
      error: (err: any) => {
        console.error('Erreur synthèse vocale par phrases:', err.message);
        this.speaking = false;
        // Repli : synthèse locale du navigateur (synchro sous-titres aussi)
        if (this.speechSynthSupported) {
          this.speakWithSpeechSynthesis(cleanText);
        }
      }
    });
  }

  // Joue la liste de fichiers audio (un par phrase) en séquence.
  // À chaque phrase, avance le sous-titre actif en même temps que le son.
  private playSentencesSequentially(audios: (string | null)[]): void {
    let index = 0;
    const length = audios.length;
    this.activeSubtitleIndex = -1;

    const playNext = () => {
      if (!this.speaking || index >= length) {
        this.finishSpeaking();
        return;
      }
      const url = audios[index];
      // Si aucune audio pour cette phrase, on passe à la suivante
      if (!url) {
        index++;
        this.activeSubtitleIndex = index;
        playNext();
        return;
      }
      this.activeSubtitleIndex = index;
      const audio = new Audio(url);
      this.currentAudio = audio;
      audio.addEventListener('ended', () => {
        index++;
        playNext();
      });
      audio.addEventListener('error', () => {
        index++;
        playNext();
      });
      audio.play().catch(() => {
        index++;
        playNext();
      });
    };

    playNext();
  }

  // Termine proprement la lecture séquentielle.
  private finishSpeaking(): void {
    this.speaking = false;
    this.activeSubtitleIndex = -1;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    // Exécute le callback de fin (pour enchaîner sur la suite)
    if (this.onSpeakingDone) {
      const cb = this.onSpeakingDone;
      this.onSpeakingDone = null;
      cb();
    }
  }

  // Lit le texte via la Web Speech API locale (pas d'appel réseau)
  // Humanisé : meilleure voix française naturelle, rythme posé,
  // et lecture à la cadence d'une explication (phrases + micro-pauses).
  private speakWithSpeechSynthesis(text: string): void {
    const synth = window.speechSynthesis;
    // Choisit la VOIX FRANÇAISE la plus naturelle (priorité aux voix neurales Microsoft)
    const frVoice = this.pickBestFrenchVoice(synth.getVoices());

    // Nettoie le texte et découpe en phrases pour un rythme d'enseignant
    const sentences = this.splitIntoSentences(this.prepareForSpeech(text));
    if (sentences.length === 0) return;

    this.currentSpeakText = text;
    this.subtitles = sentences;
    this.activeSubtitleIndex = -1;
    this.speaking = true;
    this.currentSentences = sentences;
    this.speechIndex = 0;

    // Joue la première phrase ; onenchaîne ensuite naturellement les suivantes
    this.playSentence(this.speechIndex, frVoice);
  }

  // Sélectionne la voix française la plus naturelle (neurales Microsoft en priorité)
  private pickBestFrenchVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const fr = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
    if (fr.length === 0) return null;
    // Ordre de préférence : voix neurales Microsoft naturelles
    const preferred = ['Natalie', 'Daniel', 'Denise', 'Céline', 'Hortense', 'Julie'];
    for (const name of preferred) {
      const hit = fr.find(v => v.name.includes(name));
      if (hit) return hit;
    }
    // Une voix "Online" (neural) vaut mieux qu'une voix locale robotique
    const online = fr.find(v => v.name.toLowerCase().includes('online'));
    if (online) return online;
    // Fallback : n'importe quelle voix française
    return fr[0];
  }

  // Prépare le texte : retire le formatage markdown et aère la ponctuation
  private prepareForSpeech(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')          // gras **texte**
      .replace(/\*(.*?)\*/g, '$1 ')              // italique *texte*
      .replace(/`(.*?)`/g, '$1')                // inline code
      .replace(/[*#_~\[\]<>=]+/g, ' ')          // symboles restants (dont * seuls)
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.!?;:])/g, '$1')          // espace avant la ponctuation
      .trim();
  }

  // Découpe le texte en phrases courtes pour un rythme d'explication posée
  private splitIntoSentences(text: string): string[] {
    const raw = text.match(/[^.!?;:]+[.!?;:]?/g) || [text];
    return raw
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 8); // limite par sécurité sur un texte très long
  }

  // Joue la phrase à l'index donné, puis enchaîne la suivante via onend
  private playSentence(index: number, frVoice: SpeechSynthesisVoice | null): void {
    if (index >= this.currentSentences.length) {
      this.speaking = false;
      this.activeSubtitleIndex = -1;
      this.currentSentences = [];
      return;
    }
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(this.currentSentences[index]);
    utterance.lang = 'fr-FR';
    // Rythme posé mais naturel + timbre légèrement chaleureux
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    if (frVoice) utterance.voice = frVoice;

    // Marquage du sous-titre actif dès que la phrase commence à être dite
    utterance.onstart = () => {
      this.speaking = true;
      this.activeSubtitleIndex = index;
    };
    utterance.onend = () => {
      // Micro-pause naturelle avant la phrase suivante
      if (index < this.currentSentences.length - 1) {
        const next = index + 1;
        this.speechPauseTimer = window.setTimeout(() => this.playSentence(next, frVoice), 140);
      } else {
        this.speaking = false;
        this.activeSubtitleIndex = -1;
        this.currentSentences = [];
      }
    };
    utterance.onerror = () => {
      this.speaking = false;
      this.activeSubtitleIndex = -1;
      this.currentSentences = [];
    };
    synth.speak(utterance);
  }

  // Arrête la synthèse vocale locale en cours
  stopSpeaking(): void {
    if (this.speechSynthSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    // Annule toute micro-pause programmée de la file de phrases
    if (this.speechPauseTimer !== null) {
      clearTimeout(this.speechPauseTimer);
      this.speechPauseTimer = null;
    }
    // Réinitialise la file de lecture seule
    this.currentSentences = [];
    this.speechIndex = 0;
    // Réinitialise les sous-titres synchronisés
    this.subtitles = [];
    this.activeSubtitleIndex = -1;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.speaking = false;
  }

  // ---------- MICRO / RECONNAISSANCE VOCALE ----------

  // Lance l'écoute du micro
  // → Si le navigateur supporte la Web Speech API (local), on l'utilise en premier
  // → Sinon, on enregistre l'audio et on l'envoie au backend Whisper
  async startRecording(): Promise<void> {
    // Reset de l'état précédent
    this.recognizedText = '';

    // 1. Privilégie la reconnaissance vocale LOCALE (Web Speech API)
    //    → 100% navigateur, en français, gratuit, pas de blocage réseau
    if (this.speechSupported) {
      this.startLocalSpeechRecognition();
      return;
    }

    // 2. Sinon, bascule sur l'enregistrement + backend Whisper (secours)
    if (!this.micSupported) {
      return;
    }

    try {
      // Demande l'accès au micro
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Crée un enregistreur MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioBlob = null;
      this.audioChunks = [];

      // Collecte les fragments audio
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Quand l'enregistrement s'arrête : on envoie à Whisper
      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        this.stopMediaStream(stream);
        this.transcribeBlob();
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err: any) {
      console.error('Impossible d\'accéder au micro :', err.message || err);
    }
  }

  // Reconnaissance vocale LOCALE via la Web Speech API du navigateur
  // → Ne fait AUCUN appel réseau, fonctionne en français hors-ligne (Chrome/Edge)
  private startLocalSpeechRecognition(): void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      // Fallback : enregistrement + backend Whisper
      this.startRecordingWithMediaRecorder();
      return;
    }

    const recognition = new SR();
    this.speechRecognition = recognition;

    // Configuration : français, résultats intermédiaires affichés en direct
    recognition.lang = 'fr-FR';
    recognition.continuous = false; // s'arrête quand l'utilisateur fait une pause
    recognition.interimResults = true;

    // Résultat reconnu
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      this.recognizedText = transcript;
    };

    // Fin de l'écoute : on garde le texte reconnu
    recognition.onend = () => {
      this.isRecording = false;
      this.speechRecognition = null;
      // Si du texte a été reconnu, on soumet la question
      if (this.recognizedText) {
        this.question = this.recognizedText;
        // En mode Meet : soumet automatiquement la question, puis
        // le professeur répond et REPREND l'explication de la leçon.
        this.askAI();
      } else {
        // Aucune parole détectée → reprend l'explication
        this.resumeExplanationAfterAnswer();
      }
    };

    // Gestion des erreurs
    recognition.onerror = () => {
      this.stopRecording();
      this.resumeExplanationAfterAnswer();
    };

    // Lance l'écoute
    this.isRecording = true;
    recognition.start();
  }

  // Secours : lance l'enregistrement via MediaRecorder + backend Whisper
  private async startRecordingWithMediaRecorder(): Promise<void> {
    if (!this.micSupported) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioBlob = null;
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        this.stopMediaStream(stream);
        this.transcribeBlob();
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err: any) {
      console.error('Impossible d\'accéder au micro :', err.message || err);
    }
  }

  // Arrête l'écoute du micro
  stopRecording(): void {
    // Arrête la reconnaissance vocale locale si active
    if (this.speechRecognition) {
      try { this.speechRecognition.stop(); } catch (_) {}
      this.speechRecognition = null;
      this.isRecording = false;
    }
    // Arrête l'enregistrement MediaRecorder si actif
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  // ---------- MICRO INTELLIGENT (mode Meet) ----------
  // Quand on clique sur Micro pendant une explication :
  //   1. Stop l'explication en cours, sauvegarde le texte + position
  //   2. Lance le micro pour poser une question
  //   3. Quand la réponse est donnée et terminée, reprend l'explication
  //   4. Si l'utilisateur annule le micro, reprend l'explication
  toggleMic(): void {
    // Si on est en train d'enregistrer → on arrête (le texte sera soumis)
    if (this.isRecording) {
      this.stopRecording();
      return;
    }

    // Sauvegarde le texte ET la position de reprise AVANT de l'interrompre
    if (this.speaking && this.aiExplanation) {
      this.explanationBeforeMic = this.aiExplanation;
      this.explanationResumeIndex = this.activeSubtitleIndex;
    }

    // Stop l'explication en cours (cancel tout : audio, subtitles, timers)
    this.stopSpeaking();
    this.aiAnswer = '';

    // Lance le micro
    this.startRecording();
  }

  // Envoie l'audio enregistré au backend pour transcription (Whisper)
  private transcribeBlob(): void {
    if (!this.audioBlob) return;

    this.transcribing = true;

    this.aiService.transcribeAudio(this.audioBlob).subscribe({
      next: (res) => {
        this.recognizedText = res.text;
        this.transcribing = false;
        if (this.recognizedText) {
          this.question = this.recognizedText;
          // En mode Meet : soumet automatiquement la question,
          // puis le professeur répond et reprend l'explication.
          this.askAI();
        }
      },
      error: (err: any) => {
        console.error('Erreur transcription vocale:', err);
        this.transcribing = false;
      }
    });
  }

  // Arrête toutes les pistes audio du flux micro
  private stopMediaStream(stream: MediaStream): void {
    stream.getTracks().forEach((track) => track.stop());
  }

  // Vérifie si une leçon est terminée
  isCompleted(lessonId: number): boolean {
    return this.completedLessons.has(lessonId);
  }

  // Vérifie si une leçon est sélectionnée
  isSelected(lessonId: number): boolean {
    return this.currentLesson?.id === lessonId;
  }

  // Retourne au catalogue des cours
  goBack(): void {
    this.router.navigate(['/courses']);
  }
}