// ============================================
// ChatComponent - Chat avec l'avatar
// Interface de conversation avec l'avatar
// Affiche les messages, gère l'envoi,
// et peut afficher l'avatar en vidéo
// ============================================

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConversationService } from '../../services/conversation.service';
import { AvatarService } from '../../services/avatar.service';
import { Conversation, Message, Avatar } from '../../models/models';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  // Référence au conteneur des messages pour le scroll automatique
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  // Liste des conversations
  conversations: Conversation[] = [];
  // Conversation active
  activeConversationId: number | null = null;
  // Messages de la conversation active
  messages: Message[] = [];
  // Avatar sélectionné
  selectedAvatarId: number | null = null;
  // Liste des avatars disponibles
  avatars: Avatar[] = [];
  // Texte à envoyer
  messageText = '';
  // Comportement voxal (génère de l'audio)
  useVoice = true;
  // Envoi en cours
  sending = false;
  // Chargement
  loading = true;
  // Erreur
  errorMessage = '';

  constructor(
    private conversationService: ConversationService,
    private avatarService: AvatarService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadConversations();
    this.loadAvatars();
  }

  ngOnDestroy(): void {
    // Nettoyage éventuel (fermeture des connexions WebSocket, etc.)
  }

  // Charge les conversations de l'utilisateur
  loadConversations(): void {
    this.conversationService.getConversations().subscribe({
      next: (res) => {
        this.conversations = res.conversations;
        // Vérifie si une conversation est spécifiée dans l'URL
        this.route.params.subscribe((params) => {
          if (params['id']) {
            this.selectConversation(Number(params['id']));
          } else if (this.conversations.length > 0) {
            this.selectConversation(this.conversations[0].id);
          }
        });
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des conversations';
        this.loading = false;
      }
    });
  }

  // Charge les avatars de l'utilisateur
  loadAvatars(): void {
    this.avatarService.getUserAvatars().subscribe({
      next: (res) => {
        this.avatars = res.avatars;
        if (this.avatars.length > 0) {
          this.selectedAvatarId = this.avatars[0].id;
        }
      },
      error: (err: any) => {
        console.error('Erreur avatars:', err);
      }
    });
  }

  // Crée une nouvelle conversation
  createConversation(): void {
    // Utilise l'avatar sélectionné s'il existe
    this.conversationService.createConversation(
      this.selectedAvatarId || undefined,
      'Nouvelle conversation'
    ).subscribe({
      next: (res: any) => {
        const conv = res.conversation;
        this.loadConversations();
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erreur lors de la création';
      }
    });
  }

  // Sélectionne une conversation et charge ses messages
  selectConversation(id: number): void {
    this.activeConversationId = id;
    this.conversationService.getConversation(id).subscribe({
      next: (res) => {
        this.messages = res.messages;
        this.scrollToBottom();
      },
      error: (err: any) => {
        console.error('Erreur chargement messages:', err);
      }
    });
  }

  // Envoie un message (chat avec l'avatar)
  sendMessage(): void {
    const content = this.messageText.trim();
    if (!content || !this.activeConversationId || this.sending) return;

    // Vide le champ et ajoute le message de l'utilisateur immédiatement
    this.messageText = '';
    this.sending = true;

    // Ajoute un message temporaire côté utilisateur
    this.messages.push({
      id: Date.now(), // ID temporaire négatif
      conversation_id: this.activeConversationId,
      sender: 'user',
      content,
      created_at: new Date().toISOString()
    });
    this.scrollToBottom();

    // Appelle le backend (qui appelle Groq + TTS)
    this.conversationService.sendMessage(this.activeConversationId, content, this.useVoice).subscribe({
      next: (res: any) => {
        // Ajoute la réponse de l'avatar
        if (res.aiMessage) {
          this.messages.push(res.aiMessage);
          this.scrollToBottom();
        }
        this.sending = false;
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erreur lors de l\'envoi';
        this.sending = false;
        this.scrollToBottom();
      }
    });
  }

  // Joue le message audio de l'avatar
  // NB : media_url stocké en base commence déjà par "/uploads/..."
  // Servi en relatif → nginx le redirige vers le backend (même origine)
  playAudio(mediaUrl: string): void {
    if (mediaUrl) {
      const audio = new Audio(mediaUrl);
      audio.play().catch(() => {});
    }
  }

  // Obtient l'URL d'un fichier média
  getMediaUrl(path: string): string {
    return path;
  }

  // Fait défiler vers le bas (dernier message)
  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  // Vérifie si un message est de l'utilisateur
  isUserMessage(message: Message): boolean {
    return message.sender === 'user';
  }
}
