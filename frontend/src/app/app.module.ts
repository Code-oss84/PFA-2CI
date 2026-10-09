// ============================================
// Module principal de l'application Angular
// Importe Angular Material, les modules fonctionnels
// et déclare tous les composants
// ============================================

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

// Lucide Icons
import { LucideAngularModule } from 'lucide-angular';
import {
  ArrowLeft, Volume2, Mic, MicOff, Square, Check, CheckCircle,
  Play, List, ChevronRight, BookOpen, Loader, ChevronLeft
} from 'lucide-angular';

// Routing et modules
import { AppRoutingModule } from './app.routing.module';

// Composants
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AvatarCreatorComponent } from './components/avatar-creator/avatar-creator.component';
import { CoursesComponent } from './components/courses/courses.component';
import { CourseDetailComponent } from './components/course-detail/course-detail.component';
import { ChatComponent } from './components/chat/chat.component';
import { AdminComponent } from './components/admin/admin.component';
import { NavbarComponent } from './components/navbar/navbar.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    ProfileComponent,
    AvatarCreatorComponent,
    CoursesComponent,
    CourseDetailComponent,
    ChatComponent,
    AdminComponent,
    NavbarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    // Angular Material modules
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    LucideAngularModule.pick({
      ArrowLeft, Volume2, Mic, MicOff, Square, Check, CheckCircle,
      Play, List, ChevronRight, BookOpen, Loader, ChevronLeft
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
