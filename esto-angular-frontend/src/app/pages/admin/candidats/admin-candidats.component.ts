import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-candidats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col p-4">
      <!-- Header Section -->
      <header class="flex items-center justify-between mb-3">
        <div>
          <h1 class="text-xl font-bold text-gray-800 tracking-tight">Candidats</h1>
        </div>
        <div class="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
          Total : {{ candidats.length }}
        </div>
      </header>
      
      <!-- Filters and Table Section -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
        
        <!-- Filters Area -->
        <div class="p-3 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <h2 class="text-sm font-bold text-gray-800">Liste des candidats</h2>
          <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <!-- Search by Name -->
            <div class="relative w-full sm:w-72">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input type="text" [(ngModel)]="searchQuery" placeholder="Rechercher par nom, email..." 
                     class="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-esto-primary/50 focus:border-esto-primary sm:text-sm transition-colors">
            </div>
            
            <!-- Search by Date -->
            <div class="relative w-full sm:w-48">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <input type="date" [(ngModel)]="searchDate"
                     class="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl leading-5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-esto-primary/50 focus:border-esto-primary sm:text-sm transition-colors">
            </div>
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
                <th class="px-6 py-5 font-bold">Date</th>
                <th class="px-6 py-5 font-bold">Candidat</th>
                <th class="px-6 py-5 font-bold">Laboratoire</th>
                <th class="px-6 py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr *ngFor="let candidat of filteredCandidats" class="hover:bg-gray-50/50 transition-colors group">
                <td class="px-6 py-5 align-middle whitespace-nowrap">
                  <span class="text-xs font-bold text-gray-500 bg-gray-100/80 px-2.5 py-1.5 rounded-lg border border-gray-200">
                    {{ candidat.candidature_date ? (candidat.candidature_date | date:'dd/MM/yyyy') : 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-5 align-middle">
                  <div class="font-bold text-gray-900 text-sm">{{ candidat.nom }} {{ candidat.prenom }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ candidat.email }}</div>
                </td>
                <td class="px-6 py-5 align-middle">
                  <span *ngIf="candidat.labo_nom" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {{ candidat.labo_nom }}
                  </span>
                  <span *ngIf="!candidat.labo_nom" class="text-xs text-gray-400 italic">Non assigné</span>
                </td>
                <td class="px-6 py-5 align-middle text-right">
                  <button (click)="openModal(candidat)" class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all shadow-sm group-hover:shadow group-hover:text-esto-primary">
                    Détails
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredCandidats.length === 0">
                <td colspan="4" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center justify-center text-gray-400">
                    <svg class="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    <span class="text-base font-medium">Aucun candidat trouvé.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div *ngIf="selectedCandidat" class="fixed inset-0 z-[100] overflow-y-auto">
      <div class="flex min-h-full items-start justify-center p-4 sm:p-6">
        <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
        <div class="bg-white rounded-3xl text-left shadow-2xl w-full max-w-2xl flex flex-col relative z-10 border border-gray-100 my-8 sm:my-12">
          
          <!-- Header -->
          <div class="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0 rounded-t-3xl">
            <h3 class="text-xl font-black text-gray-900">Dossier de candidature</h3>
            <button (click)="closeModal()" class="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-8 py-6 space-y-8 flex-1 bg-white rounded-b-3xl">
                     <!-- Profile Section -->
            <div class="flex flex-col sm:flex-row gap-6 items-start">
              <div class="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-3xl shrink-0 border-2 border-white shadow-sm">
                {{ (selectedCandidat.nom || 'C').substring(0, 1).toUpperCase() }}{{ (selectedCandidat.prenom || 'C').substring(0, 1).toUpperCase() }}
              </div>
              <div>
                <h2 class="text-2xl font-black text-gray-900">{{ selectedCandidat.nom?.toUpperCase() }} {{ selectedCandidat.prenom }}</h2>
                <div class="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  <span class="flex items-center"><svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg> CIN: {{ selectedCandidat.cin }}</span>
                  <span class="flex items-center"><svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> {{ selectedCandidat.email }}</span>
                  <span class="flex items-center"><svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> {{ selectedCandidat.telephone || 'Non renseigné' }}</span>
                </div>

                <div class="mt-4 flex items-center flex-wrap gap-2">
                  <span class="text-gray-500 text-sm mr-1">Diplôme Obtenu: </span>
                  <span class="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100">{{ selectedCandidat.diplome_obtenu || 'Bac+5' }}</span>
                  <span class="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 ml-2" *ngIf="selectedCandidat.candidature_date">
                    Candidature: {{ selectedCandidat.candidature_date | date:'dd/MM/yyyy' }}
                  </span>
                </div>
              </div>
            </div>
            
            <hr class="border-gray-100">

            <!-- Sujets Postulés -->
            <div>
              <h4 class="text-[11px] font-bold text-esto-primary uppercase tracking-wider mb-4">Détails des Sujets Postulés</h4>
              
              <div class="space-y-4" *ngIf="selectedCandidat.choix && selectedCandidat.choix.length > 0">
                <div *ngFor="let choix of selectedCandidat.choix; let i = index" class="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative">
                  
                  <div class="absolute top-4 right-4 z-10">
                    <span class="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                          [ngClass]="{
                            'bg-yellow-50 text-yellow-700 border border-yellow-100': choix.statut_choix === 'en_attente',
                            'bg-green-50 text-green-700 border border-green-100': choix.statut_choix === 'accepte' || choix.statut_choix === 'admis',
                            'bg-red-50 text-red-700 border border-red-100': choix.statut_choix === 'refuse'
                          }">
                      {{ getStatusLabel(choix.statut_choix) }}
                    </span>
                  </div>

                  <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-4">Choix #{{ i + 1 }}</span>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                      <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Encadrant</p>
                      <p class="font-bold text-gray-900">Pr. {{ choix.professeur_nom || 'Non défini' }} {{ choix.professeur_prenom || '' }}</p>
                    </div>
                    <div class="p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                      <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Laboratoire</p>
                      <p class="font-bold text-gray-900">{{ choix.laboratoire_nom || selectedCandidat.labo_nom || 'Non défini' }}</p>
                    </div>
                    <div class="col-span-1 md:col-span-2 p-4 border border-blue-100 rounded-xl bg-blue-50/50 shadow-sm">
                      <p class="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Sujet proposé</p>
                      <p class="font-bold text-blue-900">{{ choix.titre || 'Sujet non défini' }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div *ngIf="!selectedCandidat.choix || selectedCandidat.choix.length === 0" class="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <svg class="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <p class="text-sm text-gray-500 font-medium">Aucun sujet postulé.</p>
              </div>
            </div>

            <!-- Documents Section -->
            <div>
              <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dossier Scientifique (Pièces jointes)</h4>
              
              <div class="flex flex-col gap-4">
                  <!-- CV (Blue) -->
                  <div class="border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:border-blue-300 transition-all bg-white shadow-sm hover:shadow-md">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div>
                        <span class="block text-base font-bold text-gray-900">CV</span>
                        <span class="text-xs text-gray-400">Document PDF</span>
                      </div>
                    </div>
                    <a *ngIf="selectedCandidat.path_cv" [href]="getDocUrl(selectedCandidat.path_cv)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!selectedCandidat.path_cv" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
                  </div>

                  <!-- BAC (Orange) -->
                  <div class="border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:border-orange-400 transition-all bg-white shadow-sm hover:shadow-md">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div>
                        <span class="block text-base font-bold text-gray-900">BAC</span>
                        <span class="text-xs text-gray-400">Document PDF</span>
                      </div>
                    </div>
                    <a *ngIf="selectedCandidat.path_bac" [href]="getDocUrl(selectedCandidat.path_bac)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!selectedCandidat.path_bac" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
                  </div>

                  <!-- BAC+2 (Purple) -->
                  <div class="border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:border-purple-300 transition-all bg-white shadow-sm hover:shadow-md">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div>
                        <span class="block text-base font-bold text-gray-900">BAC+2</span>
                        <span class="text-xs text-gray-400">Document PDF</span>
                      </div>
                    </div>
                    <a *ngIf="selectedCandidat.path_bac2" [href]="getDocUrl(selectedCandidat.path_bac2)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!selectedCandidat.path_bac2" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
                  </div>

                  <!-- Licence (Rose/Pink) -->
                  <div class="border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:border-rose-300 transition-all bg-white shadow-sm hover:shadow-md">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div>
                        <span class="block text-base font-bold text-gray-900">Licence</span>
                        <span class="text-xs text-gray-400">Document PDF</span>
                      </div>
                    </div>
                    <a *ngIf="selectedCandidat.path_licence" [href]="getDocUrl(selectedCandidat.path_licence)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!selectedCandidat.path_licence" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
                  </div>

                  <!-- Master / Ing (Green) -->
                  <div class="border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:border-emerald-300 transition-all bg-white shadow-sm hover:shadow-md">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      </div>
                      <div>
                        <span class="block text-base font-bold text-gray-900">Master / Ing.</span>
                        <span class="text-xs text-gray-400">Document PDF</span>
                      </div>
                    </div>
                    <a *ngIf="selectedCandidat.path_master" [href]="getDocUrl(selectedCandidat.path_master)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!selectedCandidat.path_master" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
                  </div>
                  
                  <div *ngIf="!selectedCandidat.path_cv && !selectedCandidat.path_bac && !selectedCandidat.path_bac2 && !selectedCandidat.path_licence && !selectedCandidat.path_master" class="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <svg class="w-8 h-8 text-gray-300 mb-2 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                    <p class="text-sm text-gray-500 font-medium">Le candidat n'a fourni aucun document.</p>
                  </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    `
})
export class AdminCandidatsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';
  private storageUrl = 'http://localhost:8000/storage';
  
  candidats: any[] = [];
  isLoading = true;
  
  searchQuery = '';
  searchDate = '';
  selectedCandidat: any = null;
  showDocuments = false;

  ngOnInit() {
    this.fetchCandidats();
  }

  fetchCandidats() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/admin/candidats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.candidats = response.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des candidats:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredCandidats() {
    let result = this.candidats;
    
    // Filtre par texte (nom, prenom, email)
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(c => 
        (c.nom && c.nom.toLowerCase().includes(query)) ||
        (c.prenom && c.prenom.toLowerCase().includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query))
      );
    }

    // Filtre par date (YYYY-MM-DD)
    if (this.searchDate) {
      result = result.filter(c => {
        if (!c.candidature_date) return false;
        // c.candidature_date is usually "YYYY-MM-DD HH:mm:ss" from Laravel
        return c.candidature_date.startsWith(this.searchDate);
      });
    }

    return result;
  }

  openModal(candidat: any) {
    this.selectedCandidat = candidat;
    this.showDocuments = false;
  }

  closeModal() {
    this.selectedCandidat = null;
    this.showDocuments = false;
  }

  getDocUrl(path: string): string {
    return `${this.storageUrl}/${path}`;
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'en_attente': return 'En attente';
      case 'accepte': return 'Accepté';
      case 'admis': return 'Admis';
      case 'refuse': return 'Refusé';
      default: return status || 'N/A';
    }
  }
}

