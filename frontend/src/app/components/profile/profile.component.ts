// ============================================
// ProfileComponent - Page de profil
// Affiche et permet de modifier les informations
// de l'utilisateur
// ============================================

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  // Utilisateur courant
  user: User | null = null;
  // Formulaire de modification du profil
  profileForm: FormGroup;
  // Message de succès
  successMessage = '';
  // Message d'erreur
  errorMessage = '';
  // Indicateur de chargement
  loading = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    // Pré-remplit le formulaire avec les infos actuelles
    if (this.user) {
      this.profileForm.patchValue({
        username: this.user.username,
        email: this.user.email
      });
    }
  }

  // Getter pour les champs du formulaire
  get f() { return this.profileForm.controls; }

  // Met à jour le profil
  updateProfile(): void {
    if (this.profileForm.invalid || !this.user) {
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Appelle l'API pour mettre à jour le profil
    this.api.put(`/users/${this.user.id}`, this.profileForm.value).subscribe({
      next: (res: any) => {
        this.successMessage = 'Profil mis à jour avec succès';
        // Met à jour l'utilisateur stocké localement
        if (res.user) {
          this.authService.updateCurrentUser(res.user);
          this.user = res.user;
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erreur lors de la mise à jour';
        this.loading = false;
      }
    });
  }
}
