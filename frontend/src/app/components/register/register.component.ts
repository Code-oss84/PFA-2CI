// ============================================
// RegisterComponent - Page d'inscription
// Formulaire d'inscription avec validation
// ============================================

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  // Formulaire réactif d'inscription
  registerForm: FormGroup;
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
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Récupère les champs du formulaire
  get f() { return this.registerForm.controls; }

  // Valideur personnalisé : vérifie que les mots de passe correspondent
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // Soumet le formulaire d'inscription
  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const { username, email, password } = this.registerForm.value;
      // Appelle le service d'inscription
      await this.authService.register(username, email, password).toPromise();
      // Redirige vers le dashboard
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMessage = err.message || 'Erreur lors de l\'inscription';
    } finally {
      this.loading = false;
    }
  }
}
