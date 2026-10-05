// ============================================
// LoginComponent - Page de connexion
// Formulaire de connexion avec validation
// ============================================

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // Formulaire réactif de connexion
  loginForm: FormGroup;
  // Indicateur de chargement
  loading = false;
  // Message d'erreur
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Définit le formulaire avec les validateurs
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  // Getter pour facilité l'accès aux champs dans le template
  get f() { return this.loginForm.controls; }

  // Soumet le formulaire de connexion
  async onSubmit(): Promise<void> {
    // Vérifie que le formulaire est valide
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const { email, password } = this.loginForm.value;
      // Appelle le service de connexion
      const response: any = await this.authService.login(email, password).toPromise();
      // Redirige vers le dashboard
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      // Affiche le message d'erreur
      this.errorMessage = err.message || 'Erreur de connexion';
    } finally {
      this.loading = false;
    }
  }
}
