// ============================================
// AdminComponent - Tableau de bord administrateur
// Gestion des utilisateurs, des cours et
// affichage des statistiques globales
// ============================================

import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CourseService } from '../../services/course.service';
import { User, Course } from '../../models/models';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  // Onglet actif
  activeTab: 'users' | 'courses' | 'stats' = 'users';

  // === ONGLET UTILISATEURS ===
  users: User[] = [];

  // === ONGLET COURS ===
  courses: Course[] = [];
  // Nouveau cours à créer
  newCourse = { title: '', description: '', level: 'beginner' as const, category: '' };

  // === ONGLET STATISTIQUES ===
  stats: any = null;
  recentActivity: any[] = [];

  // Erreur
  errorMessage = '';

  constructor(
    private api: ApiService,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadCourses();
    this.loadStats();
  }

  // === MÉTHODES UTILISATEURS ===

  // Charge la liste des utilisateurs
  loadUsers(): void {
    this.api.get<{ users: User[] }>('/users').subscribe({
      next: (res) => {
        this.users = res.users;
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des utilisateurs';
      }
    });
  }

  // Supprime un utilisateur
  deleteUser(user: User): void {
    if (confirm(`Supprimer l'utilisateur "${user.username}" ?`)) {
      this.api.delete(`/users/${user.id}`).subscribe({
        next: () => this.loadUsers(),
        error: (err: any) => {
          this.errorMessage = err.message || 'Erreur lors de la suppression';
        }
      });
    }
  }

  // === MÉTHODES COURS ===

  // Charge la liste des cours
  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (res) => {
        this.courses = res.courses;
      },
      error: (err: any) => {
        console.error('Erreur cours:', err);
      }
    });
  }

  // Crée un cours
  createCourse(): void {
    this.courseService.createCourse(this.newCourse).subscribe({
      next: () => {
        this.newCourse = { title: '', description: '', level: 'beginner', category: '' };
        this.loadCourses();
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erreur lors de la création du cours';
      }
    });
  }

  // Supprime un cours
  deleteCourse(course: Course): void {
    if (confirm(`Supprimer le cours "${course.title}" ?`)) {
      this.courseService.deleteCourse(course.id).subscribe({
        next: () => this.loadCourses(),
        error: (err: any) => {
          this.errorMessage = err.message || 'Erreur lors de la suppression';
        }
      });
    }
  }

  // === MÉTHODES STATISTIQUES ===

  // Charge les statistiques globales
  loadStats(): void {
    this.api.get<any>('/stats').subscribe({
      next: (res) => {
        this.stats = res.stats;
        this.recentActivity = res.recentActivity || [];
      },
      error: (err: any) => {
        console.error('Erreur stats:', err);
      }
    });
  }
}
