// ============================================
// DashboardComponent - Tableau de bord utilisateur
// Affiche les statistiques personnelles,
// les cours récents et des actions rapides
// ============================================

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';
import { Course, User } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Utilisateur courant
  user: User | null = null;
  // Statistiques de l'utilisateur
  stats: any = null;
  // Liste des cours disponibles
  courses: Course[] = [];
  // Indicateur de chargement
  loading = true;

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router
  ) {}

  // Initialisation : charge les données
  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.loadUserData();
  }

  // Charge les statistiques et les cours
  loadUserData(): void {
    this.loading = true;

    // Récupère les statistiques utilisateur
    this.api.get<any>('/stats/user').subscribe({
      next: (res) => {
        this.stats = res.stats;
      },
      error: (err) => {
        console.error('Erreur stats:', err);
      }
    });

    // Récupère les cours disponibles
    this.courseService.getCourses().subscribe({
      next: (res) => {
        this.courses = res.courses.slice(0, 3); // Affiche les 3 premiers
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur cours:', err);
        this.loading = false;
      }
    });
  }

  // Navigue vers les cours
  goToCourses(): void {
    this.router.navigate(['/courses']);
  }

  // Navigue vers le créateur d'avatar
  goToAvatarCreator(): void {
    this.router.navigate(['/avatar-creator']);
  }

  // Navigue vers le chat
  goToChat(): void {
    this.router.navigate(['/chat']);
  }
}
