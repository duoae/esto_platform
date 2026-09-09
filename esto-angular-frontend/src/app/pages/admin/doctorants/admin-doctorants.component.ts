import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-doctorants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col p-4">
      <header class="flex items-center justify-between mb-3">
        <div>
          <h1 class="text-xl font-bold text-gray-800 tracking-tight">Doctorants</h1>
        </div>
        <div class="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
          Total : {{ doctorants.length }}
        </div>
      </header>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div class="p-3 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <h2 class="text-sm font-bold text-gray-800">Liste des doctorants</h2>
          <div class="relative w-full sm:w-72">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Rechercher..." 
                   class="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-esto-primary/50 focus:border-esto-primary sm:text-sm transition-colors">
          </div>
        </div>

        <div *ngIf="isLoading" class="flex justify-center py-16">
          <svg class="animate-spin h-10 w-10 text-esto-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <div *ngIf="!isLoading" class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600">
            <thead class="bg-gray-50/80 text-gray-500 border-b border-gray-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th class="px-6 py-5 font-bold">Doctorant</th>
                <th class="px-6 py-5 font-bold">Laboratoire</th>
                <th class="px-6 py-5 font-bold">Encadrant</th>
                <th class="px-6 py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr *ngFor="let doctorant of filteredDoctorants" class="hover:bg-gray-50/50 transition-colors group">
                <td class="px-6 py-5 align-middle">
                  <div class="flex items-center gap-3">
                    <img *ngIf="doctorant.photo_profil" [src]="getDocUrl(doctorant.photo_profil)" class="w-10 h-10 rounded-full object-cover shrink-0 border border-blue-200">
                    <div *ngIf="!doctorant.photo_profil" class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                      {{ (doctorant.nom || 'C').substring(0,1).toUpperCase() }}{{ (doctorant.prenom || '').substring(0,1).toUpperCase() }}
                    </div>
                    <div>
                      <div class="font-bold text-gray-900 text-sm">{{ doctorant.nom }} {{ doctorant.prenom }}</div>
                      <div class="text-xs text-gray-500 mt-0.5">{{ doctorant.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-5 align-middle">
                  <span *ngIf="doctorant.labo_nom" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {{ doctorant.labo_nom }}
                  </span>
                  <span *ngIf="!doctorant.labo_nom" class="text-xs text-gray-400 italic">Non assigné</span>
                </td>
                <td class="px-6 py-5 align-middle">
                  <div *ngIf="doctorant.prof_nom" class="flex items-center gap-3">
                    <img *ngIf="doctorant.prof_photo" [src]="getDocUrl(doctorant.prof_photo)" class="w-10 h-10 rounded-full object-cover shrink-0 border border-orange-200">
                    <div *ngIf="!doctorant.prof_photo" class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0 border border-orange-200">
                      {{ (doctorant.prof_nom || 'P').substring(0,1).toUpperCase() }}{{ (doctorant.prof_prenom || '').substring(0,1).toUpperCase() }}
                    </div>
                    <div>
                      <div class="font-bold text-gray-800 text-sm">{{ doctorant.prof_nom }} {{ doctorant.prof_prenom }}</div>
                      <div class="text-[11px] text-gray-500 truncate max-w-[200px]" *ngIf="doctorant.sujet_titre" [title]="doctorant.sujet_titre">{{ doctorant.sujet_titre }}</div>
                    </div>
                  </div>
                  <span *ngIf="!doctorant.prof_nom" class="text-xs text-gray-400 italic">Non encadré</span>
                </td>
                <td class="px-6 py-5 align-middle text-right">
                  <button (click)="openModal(doctorant)" class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all shadow-sm group-hover:shadow group-hover:text-esto-primary">
                    Dossier
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredDoctorants.length === 0">
                <td colspan="4" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center justify-center text-gray-400">
                    <svg class="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    <span class="text-base font-medium">Aucun doctorant trouvé.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Dossier -->
    <div *ngIf="selectedDoctorant" class="fixed inset-0 z-[100] overflow-y-auto">
      <div class="flex min-h-full items-start justify-center p-4 sm:p-6">
        <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
        <div class="relative bg-white rounded-3xl w-full max-w-3xl flex flex-col shadow-2xl my-8 sm:my-12">
        <div class="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-3xl">
          <h3 class="text-xl font-black text-gray-900">Dossier du Doctorant</h3>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="p-8 flex-1 bg-white rounded-b-3xl">
          <!-- Personnal Info -->
          <div class="mb-8 flex items-center gap-4">
            <img *ngIf="selectedDoctorant.photo_profil" [src]="getDocUrl(selectedDoctorant.photo_profil)" class="w-16 h-16 rounded-full object-cover border-2 border-esto-primary/20 shrink-0">
            <div *ngIf="!selectedDoctorant.photo_profil" class="w-16 h-16 rounded-full bg-esto-primary/10 text-esto-primary flex items-center justify-center text-xl font-bold shrink-0">
              {{ selectedDoctorant.nom.substring(0,2).toUpperCase() }}
            </div>
            <div>
              <h4 class="text-2xl font-bold text-gray-900">{{ selectedDoctorant.nom }} {{ selectedDoctorant.prenom }}</h4>
              <p class="text-gray-500">{{ selectedDoctorant.email }} • {{ selectedDoctorant.telephone || 'Aucun tel' }}</p>
            </div>
          </div>
          <!-- Subject & Prof -->
          <div class="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
              <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Encadrant</p>
              <p class="font-bold text-gray-900">{{ selectedDoctorant.prof_nom || 'Non défini' }} {{ selectedDoctorant.prof_prenom || '' }}</p>
            </div>
            <div class="p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
              <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Laboratoire</p>
              <p class="font-bold text-gray-900">{{ selectedDoctorant.labo_nom || 'Non défini' }}</p>
            </div>
            <div class="col-span-1 md:col-span-2 p-5 border border-gray-100 rounded-2xl bg-blue-50/30">
              <p class="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Sujet de thèse</p>
              <p class="font-bold text-blue-900">{{ selectedDoctorant.sujet_titre || 'Sujet non défini' }}</p>
            </div>
          </div>
          <!-- Documents -->
          <h4 class="text-[11px] font-bold text-esto-primary uppercase tracking-wider mb-4">Documents du candidat</h4>
          <div class="flex flex-col gap-3">
                <a *ngIf="selectedDoctorant.path_cv" [href]="getDocUrl(selectedDoctorant.path_cv)" target="_blank" class="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all group">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-gray-800">CV</span>
                      <span class="text-[10px] text-gray-400">Document PDF</span>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">Ouvrir</span>
                </a>
                <a *ngIf="selectedDoctorant.path_bac" [href]="getDocUrl(selectedDoctorant.path_bac)" target="_blank" class="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-orange-300 hover:shadow-md transition-all group">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-gray-800">BAC</span>
                      <span class="text-[10px] text-gray-400">Document PDF</span>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">Ouvrir</span>
                </a>
                <a *ngIf="selectedDoctorant.path_bac2" [href]="getDocUrl(selectedDoctorant.path_bac2)" target="_blank" class="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-purple-300 hover:shadow-md transition-all group">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-gray-800">BAC+2</span>
                      <span class="text-[10px] text-gray-400">Document PDF</span>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-purple-500 bg-purple-50 px-3 py-1.5 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">Ouvrir</span>
                </a>
                <a *ngIf="selectedDoctorant.path_licence" [href]="getDocUrl(selectedDoctorant.path_licence)" target="_blank" class="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-yellow-300 hover:shadow-md transition-all group">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-yellow-50 text-yellow-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-gray-800">Licence</span>
                      <span class="text-[10px] text-gray-400">Document PDF</span>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-yellow-500 bg-yellow-50 px-3 py-1.5 rounded-lg group-hover:bg-yellow-500 group-hover:text-white transition-colors">Ouvrir</span>
                </a>
                <a *ngIf="selectedDoctorant.path_master" [href]="getDocUrl(selectedDoctorant.path_master)" target="_blank" class="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-300 hover:shadow-md transition-all group">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-gray-800">Master / Ing.</span>
                      <span class="text-[10px] text-gray-400">Document PDF</span>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-green-500 bg-green-50 px-3 py-1.5 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-colors">Ouvrir</span>
                </a>
          </div>
          <div *ngIf="!selectedDoctorant.path_cv && !selectedDoctorant.path_bac && !selectedDoctorant.path_master" class="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <svg class="w-8 h-8 text-gray-300 mb-2 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
            <p class="text-sm text-gray-500 font-medium">Aucun document fourni.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDoctorantsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';
  private storageUrl = 'http://localhost:8000/storage';
  
  doctorants: any[] = [];
  isLoading = true;
  searchQuery = '';
  selectedDoctorant: any = null;

  ngOnInit() {
    this.fetchDoctorants();
  }

  fetchDoctorants() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/admin/doctorants`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.doctorants = response.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredDoctorants() {
    if (!this.searchQuery) return this.doctorants;
    const query = this.searchQuery.toLowerCase();
    return this.doctorants.filter(d => 
      (d.nom && d.nom.toLowerCase().includes(query)) ||
      (d.prenom && d.prenom.toLowerCase().includes(query)) ||
      (d.email && d.email.toLowerCase().includes(query))
    );
  }

  openModal(doctorant: any) {
    this.selectedDoctorant = doctorant;
  }

  closeModal() {
    this.selectedDoctorant = null;
  }

  getDocUrl(path: string): string {
    return `${this.storageUrl}/${path}`;
  }
}
