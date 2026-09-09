import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-candidat-sujets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">Sujets Disponibles</h1>
        <p class="text-gray-500 mt-2 text-sm">Parcourez les sujets de recherche proposés par les laboratoires de l'ESTO et postulez à ceux qui vous intéressent.</p>
      </div>
      
      <div *ngIf="isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-esto-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div *ngIf="!isLoading && subjects.length === 0" class="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900">Aucun sujet disponible</h3>
        <p class="text-gray-500 text-sm mt-1 max-w-sm">Il n'y a actuellement aucun sujet de recherche ouvert. Veuillez revenir plus tard.</p>
      </div>

      <div *ngIf="!isLoading && subjects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let subject of subjects" 
             class="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-between h-full group"
             (click)="openSubjectDetails(subject)">
          
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">{{ subject.lab }}</span>
              <span class="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded">{{ subject.status || 'Disponible' }}</span>
            </div>
            
            <h3 class="text-lg font-bold text-gray-900 leading-snug mb-3 line-clamp-3 transition-colors" [title]="subject.title">{{ subject.title }}</h3>
            <p class="text-sm text-gray-600 line-clamp-3 mb-4">{{ subject.objective || 'Aucun objectif défini' }}</p>
          </div>
          
          <div class="mt-4 pt-4 border-t border-gray-100" (click)="$event.stopPropagation()">
            <button (click)="postuler(subject.id); $event.stopPropagation()" 
                    [disabled]="hasApplied(subject.id) || myChoices.length >= 3"
                    class="w-full py-2.5 px-4 text-sm font-bold rounded transition-colors"
                    [ngClass]="(hasApplied(subject.id) || myChoices.length >= 3) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-esto-primary/10 text-esto-primary hover:bg-esto-primary hover:text-white'">
              {{ hasApplied(subject.id) ? 'Déjà postulé' : (myChoices.length >= 3 ? 'Limite atteinte (3)' : 'Postuler') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Subject Details Modal -->
      <div *ngIf="selectedSubject" class="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4" (click)="closeSubjectDetails()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" (click)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 class="text-lg font-bold text-gray-900">Détails du sujet</h3>
            <button (click)="closeSubjectDetails()" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto">
            <div class="flex items-center gap-2 mb-4">
              <span class="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">{{ selectedSubject.lab }}</span>
              <span *ngIf="selectedSubject.equipe" class="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg">{{ selectedSubject.equipe }}</span>
            </div>

            <h2 class="text-2xl font-black text-gray-900 mb-6 leading-snug">{{ selectedSubject.title }}</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Proposé par</h4>
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-esto-primary/10 to-esto-primary/5 flex items-center justify-center text-esto-primary font-bold text-xs mr-3 shadow-sm border border-esto-primary/20">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold text-gray-800">Laboratoire {{ selectedSubject.lab }}</span>
                    <span class="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Anonyme</span>
                  </div>
                </div>
              </div>
              
              <div *ngIf="selectedSubject.pole_thematique || selectedSubject.axe_recherche">
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thématique & Axe</h4>
                <div class="text-sm text-gray-700 space-y-1">
                  <div *ngIf="selectedSubject.pole_thematique"><span class="font-semibold text-gray-500">Pôle:</span> {{ selectedSubject.pole_thematique }}</div>
                  <div *ngIf="selectedSubject.axe_recherche"><span class="font-semibold text-gray-500">Axe:</span> {{ selectedSubject.axe_recherche }}</div>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div *ngIf="selectedSubject.objective">
                <h4 class="text-xs font-bold text-esto-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Objectif
                </h4>
                <p class="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed">{{ selectedSubject.objective }}</p>
              </div>

              <div *ngIf="selectedSubject.conditions_accueil">
                <h4 class="text-xs font-bold text-esto-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  Conditions d'accueil
                </h4>
                <p class="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed">{{ selectedSubject.conditions_accueil }}</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div *ngIf="selectedSubject.retombees">
                  <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Retombées attendues</h4>
                  <p class="text-sm text-gray-700 bg-white border border-gray-100 p-4 rounded-xl shadow-sm">{{ selectedSubject.retombees }}</p>
                </div>
                
                <div *ngIf="selectedSubject.financement">
                  <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Financement</h4>
                  <p class="text-sm text-gray-700 bg-white border border-gray-100 p-4 rounded-xl shadow-sm">{{ selectedSubject.financement }}</p>
                </div>
              </div>
              
              <div *ngIf="selectedSubject.production_scientifique">
                <h4 class="text-xs font-bold text-esto-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477-4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                  Production Scientifique
                </h4>
                <p class="text-sm text-gray-700 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 leading-relaxed">{{ selectedSubject.production_scientifique }}</p>
              </div>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
            <button (click)="closeSubjectDetails()" class="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">Fermer</button>
            <button (click)="postuler(selectedSubject.id); closeSubjectDetails()" 
                    [disabled]="hasApplied(selectedSubject.id) || myChoices.length >= 3"
                    [ngClass]="(hasApplied(selectedSubject.id) || myChoices.length >= 3) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-esto-primary/10 text-esto-primary hover:bg-esto-primary hover:text-white'"
                    class="px-5 py-2.5 text-sm font-bold rounded-xl transition-colors shadow-sm">
              {{ hasApplied(selectedSubject.id) ? 'Déjà postulé' : (myChoices.length >= 3 ? 'Limite atteinte (3)' : 'Postuler à ce sujet') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Custom Message Modal -->
      <div *ngIf="messageModal" class="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8 animate-fade-in-up">
          <div class="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
               [ngClass]="{
                 'bg-green-100 text-green-500': messageModal.type === 'success',
                 'bg-red-100 text-red-500': messageModal.type === 'error',
                 'bg-blue-100 text-blue-500': messageModal.type === 'confirm'
               }">
            <!-- Success Icon -->
            <svg *ngIf="messageModal.type === 'success'" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <!-- Error Icon -->
            <svg *ngIf="messageModal.type === 'error'" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            <!-- Confirm Icon -->
            <svg *ngIf="messageModal.type === 'confirm'" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          
          <h3 class="text-xl font-black text-gray-900 mb-2">{{ messageModal.title }}</h3>
          <p class="text-sm text-gray-500 mb-8">{{ messageModal.message }}</p>
          
          <div class="flex justify-center gap-3">
            <button *ngIf="messageModal.type === 'confirm'" (click)="closeMessageModal()" class="px-6 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Annuler</button>
            <button *ngIf="messageModal.type === 'confirm'" (click)="confirmAction()" class="px-6 py-2.5 text-sm font-bold text-white bg-esto-primary hover:bg-esto-primary-dark rounded-xl transition-colors shadow-sm">Confirmer</button>
            <button *ngIf="messageModal.type !== 'confirm'" (click)="closeMessageModal()" class="px-6 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors shadow-sm w-full">Compris</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CandidatSujetsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8000/api';
  
  subjects: any[] = [];
  myChoices: any[] = [];
  isLoading = true;
  selectedSubject: any = null;
  messageModal: { title: string, message: string, type: 'success' | 'error' | 'confirm', onConfirm?: () => void } | null = null;

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;
    
    // Fetch both subjects and the candidate's choices
    this.http.get<any>(`${this.apiUrl}/subjects`).subscribe({
      next: (response) => {
        this.subjects = response.data || [];
        this.fetchMyChoices();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des sujets:', err);
        this.isLoading = false;
      }
    });
  }

  fetchMyChoices() {
    this.http.get<any>(`${this.apiUrl}/candidat/mes-choix`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.myChoices = response.data || [];
        
        const isAdmis = this.myChoices.some((c: any) => c.statut_choix === 'admis');
        if (isAdmis) {
          this.router.navigate(['/candidat/suivi']);
          return;
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des choix:', err);
        this.isLoading = false;
      }
    });
  }

  hasApplied(sujetId: number): boolean {
    return this.myChoices.some(choice => choice.sujet_id === sujetId);
  }

  postuler(sujetId: number) {
    if (this.myChoices.length >= 3) {
      this.showMessage("Limite atteinte", "Vous avez atteint la limite maximale de 3 candidatures.", "error");
      return;
    }

    this.showConfirm("Confirmation de candidature", "Voulez-vous vraiment postuler à ce sujet ? Vous ne pourrez plus annuler.", () => {
      this.http.post<any>(`${this.apiUrl}/candidat/postuler`, { sujet_id: sujetId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
      }).subscribe({
        next: (response) => {
          this.showMessage("Succès !", response.message || "Candidature soumise avec succès.", "success");
          this.fetchMyChoices(); // Refresh choices to update UI
        },
        error: (err) => {
          this.showMessage("Erreur", err.error?.message || "Une erreur s'est produite lors de la candidature.", "error");
        }
      });
    });
  }

  showMessage(title: string, message: string, type: 'success' | 'error') {
    this.messageModal = { title, message, type };
  }

  showConfirm(title: string, message: string, onConfirm: () => void) {
    this.messageModal = { title, message, type: 'confirm', onConfirm };
  }

  closeMessageModal() {
    this.messageModal = null;
  }

  confirmAction() {
    if (this.messageModal && this.messageModal.onConfirm) {
      this.messageModal.onConfirm();
    }
    this.closeMessageModal();
  }

  openSubjectDetails(subject: any) {
    this.selectedSubject = subject;
  }

  closeSubjectDetails() {
    this.selectedSubject = null;
  }
}
