// ============================================
// AiService - Fonctionnalités d'intelligence artificielle
// - Demander une explication de leçon (LLM Groq)
// - Poser une question libre à l'IA
// - Reconnaissance vocale (micro → texte, via Whisper)
// ============================================

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  constructor(private api: ApiService) {}

  // === DEMANDER UNE EXPLICATION DE LEÇON ===
  // Lance l'IA pour expliquer une leçon clairement
  explainLesson(lessonTitle: string, lessonContent?: string, question?: string): Observable<{ explanation: string }> {
    return this.api.post<{ explanation: string }>('/ai/explain', {
      lessonTitle,
      lessonContent,
      question
    });
  }

  // === POSER UNE QUESTION LIBRE À L'IA ===
  askQuestion(question: string): Observable<{ answer: string }> {
    return this.api.post<{ answer: string }>('/ai/ask', { question });
  }

  // === SYNTHÈSE VOCALE (LE TEAM/LE PROFESSEUR LIT LE TEXTE) ===
  // Convertit un texte en audio MP3 via Edge TTS
  // @param text : le texte à lire
  // @param voice : (optionnel) la voix, ex. 'fr-FR-DeniseNeural'
  // @returns : chemin de l'audio généré (ex. '/uploads/tts/xxx.mp3')
  speak(text: string, voice?: string): Observable<{ audioPath: string; audioUrl: string }> {
    return this.api.post<{ audioPath: string; audioUrl: string }>('/ai/speak', { text, voice });
  }

  // === SYNTHÈSE VOCALE PAR PHRASES (SOUS-TITRES FILM) ===
  // Génère UN MP3 par phrase pour une lecture séquentielle avec
  // des sous-titres exactement synchronisés au son.
  // @returns : { sentences: string[], audios: string[] } (chemins MP3)
  speakSentences(text: string, voice?: string): Observable<{ sentences: string[]; audios: string[] }> {
    return this.api.post<{ sentences: string[]; audios: string[] }>('/ai/speak-sentences', { text, voice });
  }

  // === RECONNAISSANCE VOCALE (MICRO) ===
  // Envoie le fichier audio au backend (Whisper) pour le transcrire en texte
  transcribeAudio(audioBlob: Blob): Observable<{ text: string }> {
    const formData = new FormData();
    // Nom du fichier + type important pour Whisper
    const extension = this.getAudioExtension(audioBlob.type);
    formData.append('audio', audioBlob, `microphone.${extension}`);
    return this.api.upload<{ text: string }>('/ai/transcribe', formData);
  }

  // Détermine l'extension selon le type MIME de l'audio
  private getAudioExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/ogg': 'ogg',
      'audio/mp4': 'm4a',
      'audio/x-m4a': 'm4a'
    };
    return mimeToExt[mimeType] || 'webm';
  }
}