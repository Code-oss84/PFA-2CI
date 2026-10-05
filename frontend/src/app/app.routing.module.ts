// ============================================
// Configuration du routage Angular
// Définit les routes et leurs protections
// ============================================

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AvatarCreatorComponent } from './components/avatar-creator/avatar-creator.component';
import { CoursesComponent } from './components/courses/courses.component';
import { CourseDetailComponent } from './components/course-detail/course-detail.component';
import { ChatComponent } from './components/chat/chat.component';
import { AdminComponent } from './components/admin/admin.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

// Définition des routes de l'application
const routes: Routes = [
  // Redirection par défaut
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Pages publiques (authentification)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Pages protégées par authentification
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'avatar-creator',
    component: AvatarCreatorComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'courses',
    component: CoursesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'courses/:id',
    component: CourseDetailComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'chat/:id',
    component: ChatComponent,
    canActivate: [AuthGuard]
  },

  // Page réservée à l'admin
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, AdminGuard]
  },

  // Fallback pour les routes inconnues
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
