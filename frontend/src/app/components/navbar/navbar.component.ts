// ============================================
// NavbarComponent - Barre de navigation
// Affiche les liens selon le rôle de l'utilisateur
// (visible si connecté, cachée sinon)
// ============================================

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  // Récupère l'utilisateur courant
  user: User | null = null;

  // Contrôle l'affichage du menu mobile
  mobileMenuOpen = false;

  constructor(private authService: AuthService, private router: Router) {
    // S'abonne aux changements de l'utilisateur courant
    this.authService.currentUser.subscribe((user) => {
      this.user = user;
    });
  }

  // Vérifie si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  // Vérifie si l'utilisateur est admin
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Déconnexion
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Bascule le menu mobile
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}
