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

  // === METTRE À JOUR UN COURS (admin) ===
  updateCourse(id: number, data: Partial<Course>): Observable<any> {
    return this.api.put(`/courses/${id}`, data);
  }

  // === SUPPRIMER UN COURS (admin) ===
  deleteCourse(id: number): Observable<any> {
    return this.api.delete(`/courses/${id}`);
  }

  // === CRÉER UNE LEÇON (admin) ===
  createLesson(courseId: number, data: Partial<Lesson>): Observable<any> {
    return this.api.post(`/courses/${courseId}/lessons`, data);
  }

  // === METTRE À JOUR UNE LEÇON (admin) ===
  updateLesson(id: number, data: Partial<Lesson>): Observable<any> {
    return this.api.put(`/lessons/${id}`, data);
  }

  // === SUPPRIMER UNE LEÇON (admin) ===
  deleteLesson(id: number): Observable<any> {
    return this.api.delete(`/lessons/${id}`);
  }

  // === MARQUER UNE LEÇON COMME TERMINÉE (user) ===
  completeLesson(lessonId: number, score?: number): Observable<any> {
    return this.api.post(`/lessons/${lessonId}/complete`, { score });
  }
}
