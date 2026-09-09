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

  getDocuments(cand: any): { key: string, label: string, path: string }[] {
    if (!cand) return [];
    const docs = [];
    for (const key of Object.keys(cand)) {
      if (key.startsWith('path_') && cand[key]) {
        let label = key.replace('path_', '').replace(/_/g, ' ');
        label = label.charAt(0).toUpperCase() + label.slice(1);
        docs.push({ key, label: 'Document ' + label, path: cand[key] });
      }
    }
    return docs;
  }

  getInfos(cand: any): { label: string, value: string }[] {
    if (!cand) return [];
    // Ignore internal keys, documents, and explicitly displayed primary fields
    const exclude = ['id', 'candidat_id', 'candidature_id', 'choix_id', 'sujet_id', 'sujet_titre', 
                     'prof_nom', 'prof_prenom', 'date_candidature', 'statut_choix', 'nom', 'prenom', 
                     'photo_profil', 'email', 'telephone', 'cin', 'role', 'created_at', 'updated_at', 
                     'mot_de_passe_hash', 'statut'];
    const infos = [];
    for (const key of Object.keys(cand)) {
      if (!key.startsWith('path_') && !exclude.includes(key) && cand[key]) {
        let label = key.replace(/_/g, ' ');
        label = label.charAt(0).toUpperCase() + label.slice(1);
        infos.push({ label, value: cand[key] });
      }
    }
    return infos;
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
