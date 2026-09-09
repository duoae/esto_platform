import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-directeur-candidats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directeur-candidats.component.html'
})
export class DirecteurCandidatsComponent implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  
  candidats: any[] = [];
  filteredCandidats: any[] = [];
  isLoading = true;
  searchTerm = '';
  selectedCandidat: any = null;
  private apiUrl = 'http://localhost:8000/api';
  private storageUrl = 'http://localhost:8000/storage';

  ngOnInit() {
    this.fetchCandidats();
  }

  fetchCandidats() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/directeur/candidats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.candidats = response.data || [];
        this.filteredCandidats = [...this.candidats];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoading = false;
      }
    });
  }

  openCandidat(cand: any) {
    this.selectedCandidat = cand;
  }

  closeModal() {
    this.selectedCandidat = null;
  }

  filterCandidats(event: any) {
    const term = event.target.value.toLowerCase();
    this.searchTerm = term;
    
    if (!term) {
      this.filteredCandidats = [...this.candidats];
      return;
    }
    
    this.filteredCandidats = this.candidats.filter(c => 
      (c.nom && c.nom.toLowerCase().includes(term)) ||
      (c.prenom && c.prenom.toLowerCase().includes(term)) ||
      (c.cin && c.cin.toLowerCase().includes(term)) ||
      (c.sujet_titre && c.sujet_titre.toLowerCase().includes(term)) ||
      (c.prof_nom && c.prof_nom.toLowerCase().includes(term))
    );
  }

  getDocUrl(path: string): string {
    return `${this.storageUrl}/${path}`;
  }

  formatStatus(status: string): string {
    const map: any = {
      'en_attente': 'En attente',
      'pre_selectionne': 'Pré-sélectionné',
      'accepte': 'Accepté',
      'admis': 'Admis',
      'refuse': 'Refusé'
    };
    return map[status] || status;
  }
}
