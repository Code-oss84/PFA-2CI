// ============================================
// AuthGuard - Protection des routes
// Empêche l'accès aux pages privées si
// l'utilisateur n'est pas authentifié
// ============================================

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  // Méthode appelée avant d'activer une route protégée
  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true; // L'utilisateur est connecté, autoriser l'accès
    }
    // Redirige vers la page de connexion
    this.router.navigate(['/login']);
    return false;
  }
}
