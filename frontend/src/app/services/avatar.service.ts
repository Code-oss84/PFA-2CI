// ============================================
// AvatarService - Gestion des avatars
// Création d'avatar à partir d'une photo,
// génération de la vidéo parlante
// ============================================

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Avatar } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  constructor(private api: ApiService) {}

  // === RÉCUPÉRER LES AVATARS DE L'UTILISATEUR ===
  getUserAvatars(): Observable<{ avatars: Avatar[] }> {
    return this.api.get<{ avatars: Avatar[] }>('/avatars');
  }

  // === CRÉER UN AVATAR AVEC UPLOAD DE PHOTO ===
  createAvatar(name: string, imageFile: File): Observable<any> {
    // Construit un FormData avec les champs
    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', imageFile, imageFile.name);
    return this.api.upload('/avatars', formData);
  }

  // === RÉCUPÉRER UN AVATAR ===
  getAvatar(id: number): Observable<{ avatar: Avatar }> {
    return this.api.get<{ avatar: Avatar }>(`/avatars/${id}`);
  }

  // === GÉNÉRER LA VIDÉO PARLANTE ===
  generateVideo(id: number, text: string): Observable<any> {
    return this.api.post(`/avatars/${id}/generate`, { text });
  }

  // === SUPPRIMER UN AVATAR ===
  deleteAvatar(id: number): Observable<any> {
    return this.api.delete(`/avatars/${id}`);
  }
}
