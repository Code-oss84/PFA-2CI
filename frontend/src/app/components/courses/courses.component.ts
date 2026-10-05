// ============================================
// CoursesComponent - Liste des cours
// Affiche tous les cours disponibles
// avec filtres par catégorie
// ============================================

import { Component, OnInit } from '@angular/core';
import { CourseService } from '../../services/course.service';
import { Course } from '../../models/models';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  // Tous les cours
  courses: Course[] = [];
  // Cours filtrés affichés
  filteredCourses: Course[] = [];
  // Catégorie sélectionnée
  selectedCategory = 'Tous';
  // Chargement
  loading = true;
  // Erreur
  errorMessage = '';

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  // Charge les cours
  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (res) => {
        this.courses = res.courses;
        this.filteredCourses = this.courses;
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des cours';
        this.loading = false;
      }
    });
  }

  // Récupère les catégories uniques
  getCategories(): string[] {
    const categories = this.courses.map(c => c.category).filter((c): c is string => !!c);
    return ['Tous', ...Array.from(new Set(categories))];
  }

  // Filtre les cours par catégorie
  filterByCategory(category: string): void {
    this.selectedCategory = category;
    if (category === 'Tous') {
      this.filteredCourses = this.courses;
    } else {
      this.filteredCourses = this.courses.filter(c => c.category === category);
    }
  }

  // Retourne la couleur associée au niveau
  getLevelColor(level: string): string {
    switch (level) {
      case 'beginner': return 'bg-green-50 text-green-700';
      case 'intermediate': return 'bg-yellow-50 text-yellow-700';
      case 'advanced': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  }

  // Libellé du niveau en français
  getLevelLabel(level: string): string {
    switch (level) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'advanced': return 'Avancé';
      default: return level;
    }
  }
}
