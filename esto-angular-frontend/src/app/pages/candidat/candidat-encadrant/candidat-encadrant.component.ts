import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-candidat-encadrant',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Simple Header to match the site theme -->
      <div class="pb-6 border-b border-gray-100">
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Mon Encadrant</h1>
        <p class="text-gray-500 mt-1 text-sm">Informations sur votre directeur de thèse et votre sujet.</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-esto-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && !encadrement" class="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h3 class="text-lg font-bold text-gray-900">Aucun encadrant trouvé</h3>
        <p class="text-sm text-gray-500 mt-2">Vous n'êtes pas encore officiellement affecté à un encadrant.</p>
        <div *ngIf="debugData" class="text-left mt-8 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
          <strong>Debug Data:</strong>
          <pre>{{ debugData | json }}</pre>
        </div>
      </div>

      <!-- Vertical Layout occupying full width -->
      <div *ngIf="!isLoading && encadrement" class="flex flex-col gap-6 w-full">
        
        <!-- Subject Card First -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h2 class="text-xl font-bold text-gray-900 mb-6 border-b border-gray-50 pb-4">Sujet de Thèse</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Titre du Sujet</label>
              <div class="text-esto-primary font-bold p-3 bg-gray-50 rounded-xl text-lg">{{ encadrement.sujet?.titre }}</div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
              <div class="text-gray-700 font-medium p-4 bg-gray-50 rounded-xl text-sm leading-relaxed whitespace-pre-line min-h-[60px]">
                {{ encadrement.sujet?.description || 'Aucune description fournie.' }}
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Diplôme Requis / Visé</label>
                <div class="text-gray-900 font-medium p-3 bg-gray-50 rounded-xl text-sm">{{ encadrement.sujet?.diplome_requis || 'Non spécifié' }}</div>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Date d'Affectation</label>
                <div class="text-gray-900 font-medium p-3 bg-gray-50 rounded-xl text-sm">{{ encadrement.date_debut | date:'longDate' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Supervisor Card Second -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <h2 class="text-xl font-bold text-gray-900 mb-6 border-b border-gray-50 pb-4">Directeur de Thèse</h2>
          
          <div class="space-y-6">
            <div class="flex items-center">
              <div class="w-16 h-16 rounded-xl bg-esto-primary/10 text-esto-primary flex items-center justify-center text-xl font-black mr-4">
                {{ encadrement.professeur?.nom?.substring(0, 2)?.toUpperCase() }}
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900">{{ encadrement.professeur?.nom }} {{ encadrement.professeur?.prenom }}</h3>
                <p class="text-sm text-gray-500 mt-1 flex items-center">
                  <svg class="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  {{ encadrement.professeur?.email }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-50 pt-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Département</label>
                <div class="text-gray-900 font-medium p-3 bg-gray-50 rounded-xl text-sm">{{ encadrement.professeur?.departement || 'Non renseigné' }}</div>
              </div>
              <div class="flex items-end">
                <a [href]="'mailto:' + encadrement.professeur?.email" class="w-full flex items-center justify-center py-3 px-4 bg-esto-primary text-white hover:bg-esto-primary-dark font-bold text-sm rounded-xl transition-all shadow-sm">
                  Contacter par e-mail
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class CandidatEncadrantComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';
  
  isLoading = true;
  encadrement: any = null;
  debugData: any = null;

  ngOnInit() {
    this.fetchEncadrant();
  }

  contacterProf(email: string, event: Event) {
    event.preventDefault();
    if (!email) return;
    
    navigator.clipboard.writeText(email).then(() => {
      alert(`L'adresse email (${email}) a été copiée dans le presse-papiers.`);
      window.location.href = `mailto:${email}`;
    }).catch(() => {
      window.location.href = `mailto:${email}`;
    });
  }

  fetchEncadrant() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/doctorant/mon-encadrant`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.encadrement = res.data;
        } else {
          this.debugData = res;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur fetching encadrant', err);
        this.debugData = err.error || err;
        this.isLoading = false;
      }
    });
  }
}
