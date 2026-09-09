import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-sujets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-sujets.component.html'
})
export class AdminSujetsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private apiUrl = 'http://localhost:8000/api';

  sujets: any[] = [];
  laboratoires: any[] = [];
  isLoading = false;

  searchQuery = '';
  selectedLabId: number | '' = '';

  viewModalOpen = false;
  selectedSujet: any = null;

  ngOnInit() {
    this.loadSujets();
    this.loadLaboratoires();
  }

  loadSujets() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/subjects`).subscribe({
      next: (res: any) => {
        let extractedData = res.data || res;
        if (extractedData && extractedData.data && Array.isArray(extractedData.data)) {
          extractedData = extractedData.data;
        }
        this.sujets = extractedData.filter((s: any) => s.status?.toLowerCase() === 'disponible' || s.statut?.toLowerCase() === 'disponible');
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement sujets', err);
        this.isLoading = false;
      }
    });
  }

  loadLaboratoires() {
    this.apiService.getLabs().subscribe({
      next: (res: any) => {
        let extractedData = res.data || res;
        if (extractedData && extractedData.data && Array.isArray(extractedData.data)) {
          extractedData = extractedData.data;
        }
        this.laboratoires = extractedData;
      },
      error: (err: any) => {
        console.error('Erreur chargement laboratoires', err);
      }
    });
  }

  get filteredSujets() {
    return this.sujets.filter(sujet => {
      const q = this.searchQuery.toLowerCase();
      const matchesSearch = !this.searchQuery || 
                            sujet.title?.toLowerCase().includes(q) || 
                            sujet.titre?.toLowerCase().includes(q) ||
                            sujet.proposer_name?.toLowerCase().includes(q) ||
                            sujet.proposer_email?.toLowerCase().includes(q) ||
                            sujet.enseignant?.name?.toLowerCase().includes(q);
      
      const labMatchId = this.selectedLabId ? String(this.selectedLabId) : '';
      let matchesLab = true;
      if (labMatchId) {
          // Attempt to match by laboratory object inside enseignant, or direct lab if API provides it
          const profLabId = sujet.proposer_lab_id || sujet.enseignant?.lab_id;
          matchesLab = String(profLabId) === labMatchId || String(sujet.laboratoire_id) === labMatchId;
      }
      return matchesSearch && matchesLab;
    });
  }

  openViewModal(sujet: any) {
    this.selectedSujet = sujet;
    this.viewModalOpen = true;
  }

  private storageUrl = 'http://localhost:8000/storage';

  getDocUrl(path: string): string {
    return `${this.storageUrl}/${path}`;
  }

  closeViewModal() {
    this.viewModalOpen = false;
    this.selectedSujet = null;
  }
}
