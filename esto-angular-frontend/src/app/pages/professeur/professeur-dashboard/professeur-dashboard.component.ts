import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-professeur-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './professeur-dashboard.component.html'
})
export class ProfesseurDashboardComponent implements OnInit {
  user: any = null;
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  stats = {
    sujets: 0,
    candidatures: 0,
    doctorants: 0
  };
  
  statusStats = {
    en_attente: 0,
    pre_selectionne: 0,
    accepte: 0,
    refuse: 0
  };

  recentCandidatures: any[] = [];
  recentSubjects: any[] = [];
  
  isLoading = true;

  ngOnInit() {
    const userStr = localStorage.getItem('esto_user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      this.loadDashboardData();
    }
  }

  loadDashboardData() {
    const token = localStorage.getItem('esto_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    forkJoin({
      sujets: this.http.get<any>(`${this.apiUrl}/subjects?enseignant_id=${this.user.id}`, { headers }),
      candidatures: this.http.get<any>(`${this.apiUrl}/professeur/candidatures`, { headers })
    }).subscribe({
      next: (res) => {
        const mySubjects = res.sujets.data || res.sujets || [];
        this.stats.sujets = mySubjects.length;
        this.recentSubjects = mySubjects.slice(0, 5);
        
        const allCandidatures = res.candidatures.data || res.candidatures || [];
        this.stats.candidatures = allCandidatures.length;
        
        // Count statuses
        this.statusStats.en_attente = allCandidatures.filter((c: any) => c.statut_choix === 'en_attente').length;
        this.statusStats.pre_selectionne = allCandidatures.filter((c: any) => c.statut_choix === 'pre_selectionne').length;
        this.statusStats.accepte = allCandidatures.filter((c: any) => c.statut_choix === 'accepte' || c.statut_choix === 'admis').length;
        this.statusStats.refuse = allCandidatures.filter((c: any) => c.statut_choix === 'refuse').length;

        // Get 5 most recent candidatures
        this.recentCandidatures = allCandidatures.slice(0, 5);
        
        this.stats.doctorants = this.statusStats.accepte;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
        this.isLoading = false;
      }
    });
  }
}
