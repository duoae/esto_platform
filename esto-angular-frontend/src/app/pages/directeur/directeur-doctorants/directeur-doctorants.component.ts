import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-directeur-doctorants',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directeur-doctorants.component.html'
})
export class DirecteurDoctorantsComponent implements OnInit {
  private http = inject(HttpClient);
  
  doctorants: any[] = [];
  filteredDoctorants: any[] = [];
  isLoading = true;
  searchTerm = '';
  selectedDoctorant: any = null;
  private apiUrl = 'http://localhost:8000/api';
  private storageUrl = 'http://localhost:8000/storage';

  ngOnInit() {
    this.fetchDoctorants();
  }

  fetchDoctorants() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/directeur/candidats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        // Filter only 'admis'
        const all = response.data || [];
        this.doctorants = all.filter((c: any) => c.statut_choix === 'admis');
        this.filteredDoctorants = [...this.doctorants];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoading = false;
      }
    });
  }

  openDoctorant(cand: any) {
    this.selectedDoctorant = cand;
  }

  closeModal() {
    this.selectedDoctorant = null;
  }

  filterDoctorants(event: any) {
    const term = event.target.value.toLowerCase();
    this.searchTerm = term;
    
    if (!term) {
      this.filteredDoctorants = [...this.doctorants];
      return;
    }
    
    this.filteredDoctorants = this.doctorants.filter(c => 
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
}
