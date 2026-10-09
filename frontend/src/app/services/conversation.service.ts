// ============================================
// ConversationService - Gestion du chat
// Création de conversations, envoi de messages,
// intégration avec l'avatar (LLM + TTS)
// ============================================

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Conversation, Message } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  constructor(private api: ApiService) {}

  // === CRÉER UNE CONVERSATION ===
  createConversation(avatarId?: number, title?: string): Observable<{ conversation: Conversation }> {
    return this.api.post<{ conversation: Conversation }>('/conversations', { avatar_id: avatarId, title });
  }

  // === LISTER LES CONVERSATIONS DE L'UTILISATEUR ===
  getConversations(): Observable<{ conversations: Conversation[] }> {
    return this.api.get<{ conversations: Conversation[] }>('/conversations');
  }

  // === RÉCUPÉRER UNE CONVERSATION AVEC SES MESSAGES ===
  getConversation(id: number): Observable<{ conversation: Conversation; messages: Message[] }> {
    return this.api.get<{ conversation: Conversation; messages: Message[] }>(`/conversations/${id}`);
  }

  // === ENVOYER UN MESSAGE (chat avec LLM) ===
  sendMessage(conversationId: number, content: string, useVoice: boolean = true): Observable<any> {
    return this.api.post(`/conversations/${conversationId}/messages`, { content, useVoice });
  }
}
