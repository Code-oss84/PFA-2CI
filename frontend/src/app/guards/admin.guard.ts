// ============================================
// AdminGuard - Protection des routes admin
// Empêche l'accès aux pages admin si l'utilisateur
// n'a pas le rôle 'admin'
// ============================================

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  // Méthode appelée avant d'activer une route réservée à l'admin
  canActivate(): boolean {
    if (this.authService.isAdmin()) {
      return true; // L'utilisateur est admin, autoriser l'accès
    }
    // Redirige vers le dashboard
    this.router.navigate(['/dashboard']);
    return false;
  }
}
