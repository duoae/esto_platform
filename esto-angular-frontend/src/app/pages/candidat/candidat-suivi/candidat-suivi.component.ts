import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-candidat-suivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 md:p-8 space-y-8 w-full font-sans">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-4xl font-black text-[#1a1a1a] tracking-tight">Suivi de Thèse</h1>
          <p class="text-gray-500 mt-2 text-sm font-medium">Déclarez vos activités et suivez votre progression vers la soutenance.</p>
        </div>
        <button (click)="openAddModal()" class="px-5 py-2.5 bg-[#b05f4c] text-white font-bold rounded-xl shadow-sm hover:bg-[#995241] transition-colors flex items-center text-sm">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
          Nouvelle activité
        </button>
      </div>

      <!-- Eligibility Banner -->
      <div *ngIf="stats?.statut_these === 'eligible_soutenance'" class="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
        <div class="flex items-center">
          <div class="bg-white/20 p-3 rounded-full mr-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h2 class="text-xl font-bold">Félicitations ! Vous êtes éligible à la soutenance.</h2>
            <p class="text-emerald-50 text-sm mt-1">Vous avez validé vos 200 heures de formation et vos 2 points scientifiques.</p>
          </div>
        </div>
        <button class="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-colors whitespace-nowrap shadow-sm">
          Générer Dossier Soutenance (PDF)
        </button>
      </div>

      <!-- Counters -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Formations -->
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
          <div class="flex items-center mb-6">
            <div class="w-12 h-12 rounded-xl bg-orange-50 text-[#b05f4c] flex items-center justify-center mr-4">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Heures de Formation</h3>
              <p class="text-sm text-gray-400 font-medium mt-0.5">Objectif : 200 heures</p>
            </div>
          </div>
          
          <div class="w-full mt-auto">
            <div class="flex items-end justify-between mb-2">
              <span class="text-3xl font-black text-gray-900">{{ stats?.total_heures || 0 }} <span class="text-sm text-gray-400 font-medium">/ 200h</span></span>
              <span class="text-sm font-bold text-[#b05f4c]">{{ getHeuresProgress() | number:'1.0-0' }}%</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2.5">
              <div class="bg-[#b05f4c] h-2.5 rounded-full transition-all duration-1000" [style.width]="getHeuresProgress() + '%'"></div>
            </div>
          </div>
        </div>

        <!-- Points Scientifiques -->
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
          <div class="flex items-center mb-6">
            <div class="w-12 h-12 rounded-xl bg-slate-100 text-[#1e293b] flex items-center justify-center mr-4">
              <!-- Beaker / Flask Icon -->
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Points Scientifiques</h3>
              <p class="text-sm text-gray-400 font-medium mt-0.5">Objectif : 2.0 points</p>
            </div>
          </div>
          
          <div class="w-full mt-auto">
            <div class="flex items-end justify-between mb-2">
              <span class="text-3xl font-black text-gray-900">{{ (stats?.total_points || 0) | number:'1.2-2' }} <span class="text-sm text-gray-400 font-medium">/ 2.0 pt</span></span>
              <span class="text-sm font-bold text-[#1e293b]">{{ getPointsProgress() | number:'1.0-0' }}%</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2.5">
              <div class="bg-[#1e293b] h-2.5 rounded-full transition-all duration-1000" [style.width]="getPointsProgress() + '%'"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activities List -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div class="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 class="text-lg font-bold text-gray-900">Historique des Activités</h3>
        </div>
        
        <div *ngIf="isLoading" class="flex justify-center py-12">
          <svg class="animate-spin h-8 w-8 text-[#b05f4c]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>

        <div *ngIf="!isLoading && activites.length === 0" class="p-16 text-center">
          <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h4 class="text-lg font-bold text-gray-900">Aucune activité déclarée</h4>
          <p class="text-sm text-gray-500 mt-1">Cliquez sur "Nouvelle activité" pour soumettre vos attestations.</p>
        </div>

        <div *ngIf="!isLoading && activites.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600">
            <thead class="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <tr>
                <th class="px-6 py-4 font-bold text-xs uppercase tracking-wider">Activité & Titre</th>
                <th class="px-6 py-4 font-bold text-xs uppercase tracking-wider">Valeur</th>
                <th class="px-6 py-4 font-bold text-xs uppercase tracking-wider">Date</th>
                <th class="px-6 py-4 font-bold text-xs uppercase tracking-wider">Statut</th>
                <th class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr *ngFor="let act of activites" class="hover:bg-gray-50/50 transition-colors group">
                <td class="px-6 py-4 align-middle">
                  <div class="font-bold text-gray-900 text-sm mb-1 line-clamp-1" [title]="act.titre">{{ act.titre }}</div>
                  <div class="text-[10px] text-gray-500 font-bold bg-gray-100/80 inline-block px-2 py-0.5 rounded tracking-wide">{{ formatType(act.type) }}</div>
                </td>
                <td class="px-6 py-4 align-middle">
                  <div *ngIf="act.heures > 0" class="font-bold text-blue-600 text-sm bg-blue-50 inline-block px-2 py-0.5 rounded">{{ act.heures }}h</div>
                  <div *ngIf="act.points > 0" class="font-bold text-[#8b5cf6] text-sm tracking-wide bg-purple-50 inline-block px-2 py-0.5 rounded">+{{ act.points | number:'1.2-2' }} pt(s)</div>
                </td>
                <td class="px-6 py-4 align-middle text-gray-500 text-sm font-medium">
                  {{ act.created_at | date:'dd/MM/yyyy' }}
                </td>
                <td class="px-6 py-4 align-middle">
                  <span *ngIf="act.statut === 'en_attente'" class="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-100">
                    En attente
                  </span>
                  <span *ngIf="act.statut === 'valide'" class="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                    Validé
                  </span>
                  <div *ngIf="act.statut === 'refuse'" class="flex flex-col gap-1.5 items-start">
                    <span class="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                      Refusé
                    </span>
                    <button *ngIf="act.motif_refus" (click)="openMotifModal(act.motif_refus)" class="text-[10px] text-red-500 hover:text-red-700 transition-colors flex items-center font-bold tracking-wide">
                      <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Voir le motif
                    </button>
                  </div>
                </td>
                <td class="px-6 py-4 align-middle text-right">
                  <a *ngIf="act.pdf_path" [href]="getDocUrl(act.pdf_path)" target="_blank" class="inline-flex items-center px-3 py-1.5 bg-gray-50 text-[#b05f4c] border border-[#b05f4c]/20 hover:bg-[#b05f4c] hover:text-white rounded-lg font-bold text-xs transition-colors">
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    Voir doc
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div *ngIf="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all border border-gray-100">
        <!-- Header -->
        <div class="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white">
          <h3 class="text-2xl font-black text-gray-900 tracking-tight">Déclarer une nouvelle activité</h3>
          <button (click)="closeAddModal()" class="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <!-- Body -->
        <div class="p-8">
          <form (ngSubmit)="submitActivite()" class="space-y-5">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Type -->
              <div class="col-span-1 md:col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-1.5">Type d'activité <span class="text-red-500">*</span></label>
                <div class="relative">
                  <select [(ngModel)]="newActivite.type" name="type" required class="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-esto-primary focus:ring-2 focus:ring-esto-primary/20">
                    <option value="" disabled selected>Sélectionner un type...</option>
                    <option value="Formation">Formation (Heures)</option>
                    <option value="Article Journal">Article Journal (+1.0 pt)</option>
                    <option value="Conference Paper">Conference Paper (+0.5 pt)</option>
                    <option value="Communication Orale">Communication Orale (+0.5 pt)</option>
                    <option value="Poster">Poster (+0.25 pt)</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              
              <!-- Titre -->
              <div [class]="newActivite.type === 'Formation' ? 'col-span-1' : 'col-span-1 md:col-span-2'">
                <label class="block text-sm font-bold text-gray-700 mb-1.5">Intitulé / Titre <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="newActivite.titre" name="titre" placeholder="Ex: Formation en IA, Article IEEE..." required class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-esto-primary focus:ring-2 focus:ring-esto-primary/20 placeholder-gray-400">
              </div>

              <!-- Heures -->
              <div *ngIf="newActivite.type === 'Formation'" class="col-span-1">
                <label class="block text-sm font-bold text-gray-700 mb-1.5">Nombre d'heures <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input type="number" [(ngModel)]="newActivite.heures" name="heures" min="1" placeholder="Ex: 15" required class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-esto-primary focus:ring-2 focus:ring-esto-primary/20 placeholder-gray-400">
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <span class="text-gray-400 text-sm">heures</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Justificatif (Drag & Drop UI) -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1.5">Justificatifs PDF <span class="text-red-500">*</span></label>
              
              <!-- Selected Files List -->
              <div *ngIf="selectedFiles.length > 0" class="mb-3 space-y-2">
                <div *ngFor="let file of selectedFiles; let i = index" class="flex items-center justify-between bg-green-50 border border-green-100 p-2.5 rounded-lg">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span class="text-sm font-medium text-green-900 truncate max-w-xs">{{ file.name }}</span>
                  </div>
                  <button type="button" (click)="removeFile(i)" class="text-red-400 hover:text-red-600 p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>

              <!-- Upload Area -->
              <div class="relative group border-2 border-dashed rounded-xl p-5 transition-all bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300">
                <input type="file" (change)="onFileSelected($event)" accept=".pdf" multiple class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                <div class="text-center pointer-events-none">
                  <div class="flex flex-col items-center">
                    <div class="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 text-gray-400 group-hover:text-esto-primary transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    <p class="text-sm font-bold text-gray-700">Ajouter un ou plusieurs fichiers PDF</p>
                    <p class="text-xs text-gray-500 mt-1">Taille maximale : 5MB par fichier</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1.5">Description <span class="text-gray-400 font-normal">(Optionnel)</span></label>
              <textarea [(ngModel)]="newActivite.description" name="description" rows="3" class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-esto-primary focus:ring-2 focus:ring-esto-primary/20 placeholder-gray-400 resize-y"></textarea>
            </div>
            
            <!-- Actions -->
            <div class="pt-6 flex items-center justify-end space-x-4">
              <button type="button" (click)="closeAddModal()" class="px-6 py-3 text-sm font-bold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                Annuler
              </button>
              <button type="submit" [disabled]="isSubmitting || selectedFiles.length === 0 || !newActivite.titre || !newActivite.type" class="px-6 py-3 text-sm font-bold text-white bg-[#b05f4c] rounded-xl hover:bg-[#995241] transition-colors flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Soumettre l'activité
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <!-- Motif Modal -->
    <div *ngIf="showMotifModal" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 class="text-lg font-bold text-gray-900">Motif de refus</h3>
          <button (click)="closeMotifModal()" class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="p-6 text-gray-700">
          <p class="whitespace-pre-wrap leading-relaxed">{{ selectedMotif }}</p>
        </div>
        <div class="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
          <button (click)="closeMotifModal()" class="px-5 py-2 text-sm font-bold text-white bg-esto-primary rounded-lg hover:bg-esto-primary/90 transition-colors shadow-sm">
            Fermer
          </button>
        </div>
      </div>
    </div>
  `
})
export class CandidatSuiviComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';
  private storageUrl = 'http://localhost:8000/storage';
  
  stats: any = null;
  activites: any[] = [];
  isLoading = true;

  // Add Modal State
  showAddModal = false;
  isSubmitting = false;
  selectedFiles: File[] = [];
  newActivite: any = {
    type: '',
    titre: '',
    description: '',
    heures: null
  };

  // Motif Modal State
  showMotifModal = false;
  selectedMotif: string = '';

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;
    const headers = { Authorization: `Bearer ${localStorage.getItem('esto_token')}` };
    
    this.http.get<any>(`${this.apiUrl}/doctorant/suivi/stats`, { headers }).subscribe({
      next: (res) => {
        if (res.success) this.stats = res.data;
      }
    });

    this.http.get<any>(`${this.apiUrl}/doctorant/suivi/activites`, { headers }).subscribe({
      next: (res) => {
        if (res.success) this.activites = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getHeuresProgress(): number {
    if (!this.stats) return 0;
    const p = (this.stats.total_heures / 200) * 100;
    return p > 100 ? 100 : p;
  }

  getPointsProgress(): number {
    if (!this.stats) return 0;
    const p = (this.stats.total_points / 2.0) * 100;
    return p > 100 ? 100 : p;
  }

  openAddModal() {
    this.showAddModal = true;
    this.selectedFiles = [];
    this.newActivite = { type: '', titre: '', description: '', heures: null };
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  openMotifModal(motif: string) {
    this.selectedMotif = motif;
    this.showMotifModal = true;
  }

  closeMotifModal() {
    this.showMotifModal = false;
    this.selectedMotif = '';
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      for (let i = 0; i < event.target.files.length; i++) {
        this.selectedFiles.push(event.target.files[i]);
      }
    }
    // Clear the input so the same file can be selected again if removed
    event.target.value = '';
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  submitActivite() {
    if (this.selectedFiles.length === 0) return;
    
    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('type', this.newActivite.type);
    formData.append('titre', this.newActivite.titre);
    formData.append('description', this.newActivite.description || '');
    if (this.newActivite.type === 'Formation' && this.newActivite.heures) {
      formData.append('heures', this.newActivite.heures.toString());
    }
    
    for (let i = 0; i < this.selectedFiles.length; i++) {
      formData.append('fichiers[]', this.selectedFiles[i]);
    }

    this.http.post<any>(`${this.apiUrl}/doctorant/suivi/activites`, formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.activites.unshift(res.data);
          this.closeAddModal();
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur lors de la soumission.');
        this.isSubmitting = false;
      }
    });
  }

  // Convert old db values to new format
  formatType(type: string): string {
    if (type === 'Document de conférence') return 'Conference Paper';
    if (type === 'Affiche') return 'Poster';
    return type;
  }

  getDocUrl(path: string): string {
    return `${this.storageUrl}/${path}`;
  }
}
