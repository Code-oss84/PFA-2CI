// ============================================
// CourseService - Gestion des cours
// Fournit les méthodes CRUD pour les cours
// et le suivi de progression
// ============================================

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Course, Lesson } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  constructor(private api: ApiService) {}

  // === RÉCUPÉRER TOUS LES COURS ===
  getCourses(): Observable<{ courses: Course[] }> {
    return this.api.get<{ courses: Course[] }>('/courses');
  }

  // === RÉCUPÉRER UN COURS AVEC SES LEÇONS ===
  getCourse(id: number): Observable<{ course: Course; lessons: Lesson[]; progress: number }> {
    return this.api.get<{ course: Course; lessons: Lesson[]; progress: number }>(`/courses/${id}`);
  }

  // === CRÉER UN COURS (admin) ===
  createCourse(data: Partial<Course>): Observable<any> {
    return this.api.post('/courses', data);
  }

  // === SUPPRIMER UN COURS (admin) ===
  deleteCourse(id: number): Observable<any> {
    return this.api.delete(`/courses/${id}`);
  }

  // === MARQUER UNE LEÇON COMME TERMINÉE (user) ===
  completeLesson(lessonId: number, score?: number): Observable<any> {
    return this.api.post(`/lessons/${lessonId}/complete`, { score });
  }
}
