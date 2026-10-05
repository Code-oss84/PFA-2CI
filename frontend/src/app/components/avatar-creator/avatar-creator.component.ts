// ============================================
// AvatarCreatorComponent - Création d'avatar
// Upload d'une photo pour créer un avatar,
// affiche les avatars existants avec leur statut
// ============================================

import { Component, OnInit } from '@angular/core';
import { AvatarService } from '../../services/avatar.service';
import { Avatar } from '../../models/models';

@Component({
  selector: 'app-avatar-creator',
  templateUrl: './avatar-creator.component.html',
  styleUrls: ['./avatar-creator.component.css']
})
export class AvatarCreatorComponent implements OnInit {
  // Nom de l'avatar à créer
  avatarName = '';
  // Fichier photo sélectionné
  selectedFile: File | null = null;
  // Aperçu de l'image
  imagePreview: string | null = null;
  // Liste des avatars créés
  avatars: Avatar[] = [];
  // Indicateur de création
  creating = false;
  // Message d'erreur
  errorMessage = '';
  // Message de succès
  successMessage = '';
  // Texte pour la génération
  speechText = '';

  constructor(
    private avatarService: AvatarService
  ) {}

  ngOnInit(): void {
    this.loadAvatars();
  }

  // Charge les avatars de l'utilisateur
  loadAvatars(): void {
    this.avatarService.getUserAvatars().subscribe({
      next: (res) => {
        this.avatars = res.avatars;
      },
      error: (err) => {
        console.error('Erreur avatars:', err);
      }
    });
  }

  // Gère la sélection d'un fichier
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // Crée un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Crée l'avatar avec la photo
  createAvatar(): void {
    if (!this.selectedFile || !this.avatarName.trim()) {
      this.errorMessage = 'Veuillez entrer un nom et sélectionner une photo';
      return;
    }

    this.creating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.avatarService.createAvatar(this.avatarName.trim(), this.selectedFile).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || 'Avatar créé avec succès ! La vidéo est en cours de génération.';
        // Réinitialise le formulaire
        this.avatarName = '';
        this.selectedFile = null;
        this.imagePreview = null;
        // Recharge la liste
        this.loadAvatars();
        this.creating = false;
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erreur lors de la création';
        this.creating = false;
      }
    });
  }

  // Génère la vidéo parlante d'un avatar
  generateSpeech(avatar: Avatar): void {
    if (!this.speechText.trim()) {
      this.errorMessage = 'Veuillez entrer un texte pour votre avatar';
      return;
    }
    this.avatarService.generateVideo(avatar.id, this.speechText).subscribe({
      next: () => {
        this.successMessage = 'Génération de la vidéo lancée ! Patientez quelques instants.';
        this.speechText = '';
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erreur lors de la génération';
      }
    });
  }

  // Supprime un avatar
  deleteAvatar(avatar: Avatar): void {
    if (confirm(`Supprimer l'avatar "${avatar.name}" ?`)) {
      this.avatarService.deleteAvatar(avatar.id).subscribe({
        next: () => {
          this.loadAvatars();
        },
        error: (err: any) => {
          this.errorMessage = err.message || 'Erreur lors de la suppression';
        }
      });
    }
  }

  // Obtenir l'URL complète d'une image
  // NB : source_image/video_url stockés en base commencent déjà par "/uploads/..."
  // Servis en relatif → nginx les redirige vers le backend (même origine)
  getImageUrl(path: string): string {
    return path;
  }

  // Aide pour la sélection de fichier
  onDragOver(event: any): void {
    event.preventDefault();
  }

  onDrop(event: any): void {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
