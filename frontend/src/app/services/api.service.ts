// ============================================
// ApiService - Service HTTP de base
// Intercepte les requêtes pour ajouter le token JWT
// et gère les erreurs
// ============================================

import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // URL de base de l'API
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  // === CONSTRUIT LES EN-TÊTES AVEC JWT ===
  private headers(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.authService.getToken();
    if (token) {
      // Ajoute le token Bearer pour l'authentification
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    headers = headers.set('Content-Type', 'application/json');
    return headers;
  }

  // === REQUÊTE GET ===
  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { headers: this.headers() })
      .pipe(catchError((err) => this.handleError(err)));
  }

  // === REQUÊTE POST ===
  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() })
      .pipe(catchError((err) => this.handleError(err)));
  }

  // === REQUÊTE PUT ===
  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() })
      .pipe(catchError((err) => this.handleError(err)));
  }

  // === REQUÊTE DELETE ===
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, { headers: this.headers() })
      .pipe(catchError((err) => this.handleError(err)));
  }

  // === UPLOAD DE FICHIER (multipart/form-data) ===
  upload<T>(path: string, formData: FormData): Observable<T> {
    // Pour multipart, ne PAS définir Content-Type (Angular le fait automatiquement)
    let headers = new HttpHeaders();
    const token = this.authService.getToken();
    if (token) {
      // NB : HttpHeaders est IMMUABLE — il faut RÉASSIGNER le résultat de set()
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post<T>(`${this.baseUrl}${path}`, formData, { headers })
      .pipe(catchError((err) => this.handleError(err)));
  }

  // === GESTION DES ERREURS ===
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = error.error?.error || error.error?.message || `Erreur serveur (${error.status})`;

      // Si 401, la session a expiré
      if (error.status === 401) {
        this.authService.logout();
        this.router.navigate(['/login']);
        errorMessage = 'Session expirée, veuillez vous reconnecter';
      }

      // Si 403, accès refusé
      if (error.status === 403) {
        errorMessage = 'Accès refusé';
      }
    }

    console.error('[API Error]', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
