// Recompile triggered 2
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';
import { DirecteursComponent } from './pages/admin/directeurs/directeurs.component';
import { LaboratoiresComponent } from './pages/admin/laboratoires/laboratoires.component';
import { AdminLayoutComponent } from './pages/admin/admin-layout/admin-layout.component';
import { DirecteurLayoutComponent } from './pages/directeur/directeur-layout/directeur-layout.component';
import { DirecteurDashboardComponent } from './pages/directeur/directeur-dashboard/directeur-dashboard.component';
import { DirecteurMonLaboComponent } from './pages/directeur/directeur-mon-labo/directeur-mon-labo.component';
import { DirecteurProfesseursComponent } from './pages/directeur/directeur-professeurs/directeur-professeurs.component';
import { DirecteurSujetsComponent } from './pages/directeur/directeur-sujets/directeur-sujets.component';
import { DirecteurProfileComponent } from './pages/directeur/directeur-profile/directeur-profile.component';
import { DirecteurStatsComponent } from './pages/directeur/directeur-stats/directeur-stats.component';
import { ProfesseurLayoutComponent } from './pages/professeur/professeur-layout/professeur-layout.component';
import { ProfesseurDashboardComponent } from './pages/professeur/professeur-dashboard/professeur-dashboard.component';
import { ProfesseurSujetsComponent } from './pages/professeur/professeur-sujets/professeur-sujets.component';

import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'admin', 
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'laboratoires', component: LaboratoiresComponent },
      { path: 'directeurs', component: DirecteursComponent },
      { path: 'professeurs', loadComponent: () => import('./pages/admin/professeurs/professeurs.component').then(m => m.ProfesseursComponent) },
      { path: 'candidats', loadComponent: () => import('./pages/admin/candidats/admin-candidats.component').then(m => m.AdminCandidatsComponent) },
      { path: 'doctorants', loadComponent: () => import('./pages/admin/doctorants/admin-doctorants.component').then(m => m.AdminDoctorantsComponent) },
      {
        path: 'messages',
        loadComponent: () => import('./pages/admin/messages/admin-messages.component').then(m => m.AdminMessagesComponent)
      },
      { path: 'sujets', loadComponent: () => import('./pages/admin/sujets/admin-sujets.component').then(m => m.AdminSujetsComponent) },
      { path: 'profil', loadComponent: () => import('./pages/admin/admin-profile/admin-profile.component').then(m => m.AdminProfileComponent) },
      { path: 'statistiques', component: DashboardComponent },
      { path: 'chatbot-logs', loadComponent: () => import('./components/admin/admin-chatbot-logs/admin-chatbot-logs.component').then(m => m.AdminChatbotLogsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'directeur',
    component: DirecteurLayoutComponent,
    children: [
      { path: 'dashboard', component: DirecteurDashboardComponent },
      { path: 'mon-laboratoire', component: DirecteurMonLaboComponent },
      { path: 'professeurs', component: DirecteurProfesseursComponent },
      { path: 'sujets', component: DirecteurSujetsComponent },
      {
        path: 'candidats',
        loadComponent: () => import('./pages/directeur/directeur-candidats/directeur-candidats.component').then(m => m.DirecteurCandidatsComponent)
      },
      {
        path: 'doctorants',
        loadComponent: () => import('./pages/directeur/directeur-doctorants/directeur-doctorants.component').then(m => m.DirecteurDoctorantsComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./pages/directeur/directeur-messages/directeur-messages.component').then(m => m.DirecteurMessagesComponent)
      },
      { path: 'statistiques', component: DirecteurStatsComponent },
      { path: 'profil', component: DirecteurProfileComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'professeur',
    component: ProfesseurLayoutComponent,
    children: [
      { path: 'dashboard', component: ProfesseurDashboardComponent },
      { path: 'sujets', component: ProfesseurSujetsComponent },
      { path: 'candidatures', loadComponent: () => import('./pages/professeur/professeur-candidatures/professeur-candidatures.component').then(m => m.ProfesseurCandidaturesComponent) },
      { path: 'doctorants', loadComponent: () => import('./pages/professeur/professeur-doctorants/professeur-doctorants.component').then(m => m.ProfesseurDoctorantsComponent) },
      { path: 'messages', loadComponent: () => import('./pages/professeur/professeur-messages/professeur-messages.component').then(m => m.ProfesseurMessagesComponent) },
      { path: 'profile', loadComponent: () => import('./pages/professeur/professeur-profile/professeur-profile.component').then(m => m.ProfesseurProfileComponent) },
      { path: 'statistiques', loadComponent: () => import('./pages/professeur/professeur-stats/professeur-stats.component').then(m => m.ProfesseurStatsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'candidat',
    // Using loadComponent for lazy loading of the new Candidat layout component
    loadComponent: () => import('./pages/candidat/candidat-layout/candidat-layout.component').then(m => m.CandidatLayoutComponent),
    children: [
      { path: 'mes-candidatures', loadComponent: () => import('./pages/candidat/candidat-mes-candidatures/candidat-mes-candidatures.component').then(m => m.CandidatMesCandidaturesComponent) },
      { path: 'sujets', loadComponent: () => import('./pages/candidat/candidat-sujets/candidat-sujets.component').then(m => m.CandidatSujetsComponent) },
      { path: 'profile', loadComponent: () => import('./pages/candidat/candidat-profile/candidat-profile.component').then(m => m.CandidatProfileComponent) },
      { path: 'messages', loadComponent: () => import('./pages/candidat/candidat-messages/candidat-messages.component').then(m => m.CandidatMessagesComponent) },
      { path: 'suivi', loadComponent: () => import('./pages/candidat/candidat-suivi/candidat-suivi.component').then(m => m.CandidatSuiviComponent) },
      { path: 'encadrant', loadComponent: () => import('./pages/candidat/candidat-encadrant/candidat-encadrant.component').then(m => m.CandidatEncadrantComponent) },
      { path: '', redirectTo: 'sujets', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
