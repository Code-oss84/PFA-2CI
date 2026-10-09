// ============================================
// AuthService - Gestion de l'authentification
// Stocke le token JWT dans localStorage
// et gère les appels d'inscription/connexion
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL de base de l'API d'authentification
  private apiUrl = `${environment.apiUrl}/auth`;

  // Stocke l'utilisateur courant (observable pour réactivité)
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    // Initialise l'utilisateur depuis le localStorage au démarrage
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Getter pour l'utilisateur courant
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Getter pour le token JWT
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // === CONNEXION ===
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(map((response) => {
        // Stocke le token et l'utilisateur si la connexion réussit
        if (response.token && response.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
        return response;
      }));
  }

  // === INSCRIPTION ===
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, { username, email, password })
      .pipe(map((response) => {
        // Auto-connecte l'utilisateur après l'inscription
        if (response.token && response.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
        return response;
      }));
  }

  // === DÉCONNEXION ===
  logout(): void {
    // Supprime le token et l'utilisateur du localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // === VÉRIFIER L'AUTHENTIFICATION ===
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUserValue;
  }

  // === VÉRIFIER SI ADMIN ===
  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  // === METTRE À JOUR L'UTILISATEUR COURANT ===
  updateCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}
