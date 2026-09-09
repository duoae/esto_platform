import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-professeur-doctorants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Mes Doctorants</h1>
          <p class="text-gray-500 mt-1 text-sm">Consultez la liste des doctorants officiellement admis dans vos sujets de recherche.</p>
        </div>
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <!-- Subject Filter -->
          <div class="relative w-full sm:w-56 shrink-0">
            <select (change)="onSubjectFilterChange($event)" class="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-esto-primary focus:border-esto-primary outline-none transition-colors text-[13px] text-gray-700 appearance-none">
              <option value="">Tous les sujets</option>
              <option *ngFor="let subject of uniqueSubjects" [value]="subject">{{ subject }}</option>
            </select>
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          <!-- Search Bar -->
          <div class="relative w-full sm:w-72 shrink-0">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input type="text"
                   (input)="onSearchChange($event)"
                   class="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-esto-primary focus:border-esto-primary outline-none transition-colors text-[13px] text-gray-700 placeholder-gray-400"
                   placeholder="Rechercher par nom ou email...">
          </div>
        </div>
      </div>
      
      <div *ngIf="isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-esto-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div *ngIf="!isLoading && filteredDoctorants.length === 0" class="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900">Aucun doctorant</h3>
        <p class="text-gray-500 text-sm mt-1 max-w-sm mb-6">Vous n'avez pas encore de doctorants admis pour vos sujets.</p>
      </div>

      <div *ngIf="!isLoading && filteredDoctorants.length > 0" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600">
            <thead class="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <tr>
                <th class="px-6 py-4 font-bold w-[35%]">Doctorant</th>
                <th class="px-6 py-4 font-bold w-[25%]">Diplôme & Labo</th>
                <th class="px-6 py-4 font-bold w-[25%]">Sujet de thèse</th>
                <th class="px-6 py-4 font-bold text-right w-[15%]">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr *ngFor="let cand of filteredDoctorants" class="hover:bg-gray-50/50 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-esto-primary/10 text-esto-primary font-bold flex items-center justify-center shrink-0">
                      {{ cand.candidat_nom?.charAt(0) }}{{ cand.candidat_prenom?.charAt(0) }}
                    </div>
                    <div>
                      <div class="font-bold text-gray-900">{{ cand.candidat_nom }} {{ cand.candidat_prenom }}</div>
                      <div class="text-xs text-gray-500 mt-0.5">{{ cand.candidat_email }}</div>
                      <div class="text-[10px] text-gray-400">{{ cand.candidat_telephone }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ cand.diplome_obtenu || 'N/A' }}</div>
                  <div class="text-xs text-gray-500 mt-0.5 line-clamp-1" [title]="cand.labo_nom">{{ cand.labo_nom || 'Non assigné' }}</div>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm font-bold text-gray-700 line-clamp-2" [title]="cand.sujet_titre">{{ cand.sujet_titre }}</p>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2 transition-opacity" (click)="$event.stopPropagation()">
                    <button (click)="openDossierModal(cand)" class="flex items-center text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg py-2 px-3 transition-colors" title="Dossier de candidature">
                      <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Dossier
                    </button>
                    <button (click)="openSuiviModal(cand)" class="flex items-center text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 px-3 transition-colors" title="Suivi de Thèse">
                      <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                      Suivi
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Dossier Modal -->
    <div *ngIf="showDossierModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div class="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-esto-primary/10 text-esto-primary flex items-center justify-center font-bold text-lg">
              {{ selectedDossier?.candidat_nom?.charAt(0) }}{{ selectedDossier?.candidat_prenom?.charAt(0) }}
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 leading-tight">{{ selectedDossier?.candidat_nom }} {{ selectedDossier?.candidat_prenom }}</h3>
              <p class="text-xs text-gray-500 font-medium">Dossier de candidature</p>
            </div>
          </div>
          <button (click)="closeDossierModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <!-- Content -->
        <div class="p-6 overflow-y-auto flex-1">
          <div class="flex flex-col gap-6">
            
            <!-- Personal & Academic Info -->
            <div class="space-y-6">
              
              <!-- Contact Info -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contact & Personnel</h4>
                <ul class="space-y-4">
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    <div>
                      <span class="block text-xs text-gray-500">Email</span>
                      <span class="text-sm font-medium text-gray-900">{{ selectedDossier?.candidat_email }}</span>
                    </div>
                  </li>
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    <div>
                      <span class="block text-xs text-gray-500">Téléphone</span>
                      <span class="text-sm font-medium text-gray-900">{{ selectedDossier?.candidat_telephone || 'Non renseigné' }}</span>
                    </div>
                  </li>
                </ul>
              </div>

              <!-- Academic Info -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Parcours Académique</h4>
                <ul class="space-y-4">
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
                    <div>
                      <span class="block text-xs text-gray-500">Diplôme obtenu</span>
                      <span class="text-sm font-bold text-gray-900">{{ selectedDossier?.diplome_obtenu || 'Non renseigné' }}</span>
                    </div>
                  </li>
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    <div>
                      <span class="block text-xs text-gray-500">Spécialité</span>
                      <span class="text-sm font-medium text-gray-900">{{ selectedDossier?.specialite || 'Non renseignée' }}</span>
                    </div>
                  </li>
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    <div>
                      <span class="block text-xs text-gray-500">Établissement</span>
                      <span class="text-sm font-medium text-gray-900">{{ selectedDossier?.etablissement || 'Non renseigné' }}</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Thesis Info -->
            <div class="space-y-6">
              
              <!-- Sujet & Labo -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">Informations de la Thèse</h4>
                
                <div class="mb-5">
                  <span class="block text-xs text-gray-500 mb-1">Sujet sélectionné</span>
                  <p class="text-base font-bold text-gray-900">{{ selectedDossier?.sujet_titre }}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <span class="block text-xs text-gray-500 mb-1">Laboratoire d'accueil</span>
                    <p class="text-sm font-bold text-gray-900">{{ selectedDossier?.labo_nom || 'Non assigné' }}</p>
                  </div>
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <span class="block text-xs text-gray-500 mb-1">Statut d'admission</span>
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                      Admis(e)
                    </span>
                  </div>
                </div>
              </div>

              <!-- Documents -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Documents du candidat</h4>
                
                <div class="flex flex-col gap-4">
                  <!-- CV -->
                  <div class="border border-gray-200 rounded-xl p-4 flex items-center justify-between group hover:border-esto-primary transition-colors">
                    <div class="flex items-center">
                      <div class="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mr-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                      </div>
                      <div>
                        <span class="block text-sm font-bold text-gray-900">Curriculum Vitae (CV)</span>
                        <span class="text-xs text-gray-500">Format PDF</span>
                      </div>
                    </div>
                    <a *ngIf="selectedDossier?.cv_path" [href]="getDocUrl(selectedDossier?.cv_path)" target="_blank" class="p-2 text-esto-primary hover:bg-esto-primary/10 rounded-lg transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </a>
                    <span *ngIf="!selectedDossier?.cv_path" class="text-xs text-gray-400 italic">Non fourni</span>
                  </div>

                  <!-- Bac -->
                  <div class="border border-gray-200 rounded-xl p-4 flex items-center justify-between group hover:border-esto-primary transition-colors">
                    <div class="flex items-center">
                      <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div>
                        <span class="block text-sm font-bold text-gray-900">Diplôme du Bac</span>
                        <span class="text-xs text-gray-500">Format PDF</span>
                      </div>
                    </div>
                    <a *ngIf="selectedDossier?.bac_path" [href]="getDocUrl(selectedDossier?.bac_path)" target="_blank" class="p-2 text-esto-primary hover:bg-esto-primary/10 rounded-lg transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </a>
                    <span *ngIf="!selectedDossier?.bac_path" class="text-xs text-gray-400 italic">Non fourni</span>
                  </div>

                  <!-- Bac+2 -->
                  <div class="border border-gray-200 rounded-xl p-4 flex items-center justify-between group hover:border-esto-primary transition-colors">
                    <div class="flex items-center">
                      <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div>
                        <span class="block text-sm font-bold text-gray-900">Diplôme Bac+2</span>
                        <span class="text-xs text-gray-500">Format PDF</span>
                      </div>
                    </div>
                    <a *ngIf="selectedDossier?.bac2_path" [href]="getDocUrl(selectedDossier?.bac2_path)" target="_blank" class="p-2 text-esto-primary hover:bg-esto-primary/10 rounded-lg transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </a>
                    <span *ngIf="!selectedDossier?.bac2_path" class="text-xs text-gray-400 italic">Non fourni</span>
                  </div>

                  <!-- Licence -->
                  <div class="border border-gray-200 rounded-xl p-4 flex items-center justify-between group hover:border-esto-primary transition-colors">
                    <div class="flex items-center">
                      <div class="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mr-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div>
                        <span class="block text-sm font-bold text-gray-900">Diplôme Licence</span>
                        <span class="text-xs text-gray-500">Format PDF</span>
                      </div>
                    </div>
                    <a *ngIf="selectedDossier?.licence_path" [href]="getDocUrl(selectedDossier?.licence_path)" target="_blank" class="p-2 text-esto-primary hover:bg-esto-primary/10 rounded-lg transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </a>
                    <span *ngIf="!selectedDossier?.licence_path" class="text-xs text-gray-400 italic">Non fourni</span>
                  </div>

                  <!-- Master / Projet -->
                  <div class="border border-gray-200 rounded-xl p-4 flex items-center justify-between group hover:border-esto-primary transition-colors">
                    <div class="flex items-center">
                      <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div>
                        <span class="block text-sm font-bold text-gray-900">Diplôme Master / Projet</span>
                        <span class="text-xs text-gray-500">Format PDF</span>
                      </div>
                    </div>
                    <a *ngIf="selectedDossier?.master_path" [href]="getDocUrl(selectedDossier?.master_path)" target="_blank" class="p-2 text-esto-primary hover:bg-esto-primary/10 rounded-lg transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </a>
                    <span *ngIf="!selectedDossier?.master_path" class="text-xs text-gray-400 italic">Non fourni</span>
                  </div>
                  
                </div>
              </div>
              
              
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Suivi Modal (NEW CREDIT SYSTEM) -->
    <div *ngIf="showSuiviModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div class="bg-gray-50 rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden transform transition-all h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <h3 class="text-lg font-bold text-gray-900">
            Suivi de Thèse - <span class="text-esto-primary">{{ selectedDossier?.candidat_nom }} {{ selectedDossier?.candidat_prenom }}</span>
          </h3>
          <button (click)="closeSuiviModal()" class="text-gray-400 hover:text-gray-500 bg-gray-100 rounded-full p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6">
          <div *ngIf="isLoadingSuivi" class="flex justify-center py-12">
            <svg class="animate-spin h-8 w-8 text-esto-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </div>

          <ng-container *ngIf="!isLoadingSuivi">
            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <!-- Heures -->
              <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div class="flex items-center justify-between mb-5">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                      <div class="text-sm font-bold text-gray-500">Heures de formation</div>
                      <div class="text-2xl font-black text-gray-900 mt-1">{{ suiviStats?.total_heures || 0 }} <span class="text-sm font-bold text-gray-400">/ 200h</span></div>
                    </div>
                  </div>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                  <div class="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" [style.width]="getHeuresProgress() + '%'"></div>
                </div>
                <div class="flex justify-between items-center text-xs font-bold">
                  <span class="text-gray-400">Progression</span>
                  <span class="text-blue-600">{{ getHeuresProgress() | number:'1.0-0' }}%</span>
                </div>
              </div>
              
              <!-- Points -->
              <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div class="flex items-center justify-between mb-5">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    </div>
                    <div>
                      <div class="text-sm font-bold text-gray-500">Points scientifiques</div>
                      <div class="text-2xl font-black text-gray-900 mt-1">{{ suiviStats?.total_points || 0 | number:'1.2-2' }} <span class="text-sm font-bold text-gray-400">/ 2.0</span></div>
                    </div>
                  </div>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                  <div class="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out" [style.width]="getPointsProgress() + '%'"></div>
                </div>
                <div class="flex justify-between items-center text-xs font-bold">
                  <span class="text-gray-400">Progression</span>
                  <span class="text-purple-600">{{ getPointsProgress() | number:'1.0-0' }}%</span>
                </div>
              </div>
            </div>

            <!-- Eligibilite Alert -->
            <div *ngIf="suiviStats?.statut_these === 'eligible_soutenance'" class="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 mb-8 flex items-center">
              <svg class="w-6 h-6 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div>
                <strong class="block text-sm">Le doctorant a atteint les objectifs requis !</strong>
                <span class="text-xs">Il est maintenant éligible pour la soutenance de thèse.</span>
              </div>
            </div>

            <!-- Activités Table -->
            <h4 class="font-bold text-gray-900 mb-4 text-lg">Activités soumises par le doctorant</h4>
            
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div *ngIf="activites.length === 0" class="p-8 text-center text-gray-500 text-sm">
                Aucune activité n'a été soumise pour le moment.
              </div>
              <table *ngIf="activites.length > 0" class="w-full text-left text-sm text-gray-600">
                <thead class="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th class="px-6 py-4 font-bold w-[45%]">Activité & Justificatif</th>
                    <th class="px-6 py-4 font-bold w-[15%]">Valeur</th>
                    <th class="px-6 py-4 font-bold w-[20%]">Soumission</th>
                    <th class="px-6 py-4 font-bold text-center w-[20%]">Statut</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr *ngFor="let act of activites">
                    <td class="px-6 py-4 align-top">
                      <div class="font-bold text-gray-900 text-base mb-1">{{ act.titre }}</div>
                      <div class="text-xs text-gray-500 mb-3">{{ formatType(act.type) }}</div>
                      <div class="flex flex-wrap items-center gap-2">
                        <a *ngIf="act.pdf_path" [href]="getDocUrl(act.pdf_path)" target="_blank" class="text-esto-primary bg-esto-primary/10 hover:bg-esto-primary/20 px-3 py-1.5 rounded-lg text-xs flex items-center font-bold transition-colors">
                          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                          Justificatif
                        </a>
                        <button *ngIf="act.description" (click)="openDescModal(act.description)" class="text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs flex items-center font-bold transition-colors">
                          <svg class="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                          Détails
                        </button>
                      </div>
                    </td>
                    <td class="px-6 py-4 align-top pt-5">
                      <div *ngIf="act.heures > 0" class="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-black bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">{{ act.heures }}h</div>
                      <div *ngIf="act.points > 0" class="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-black bg-purple-50 text-purple-600 border border-purple-100 whitespace-nowrap">+{{ act.points }} pt(s)</div>
                    </td>
                    <td class="px-6 py-4 align-top pt-5 text-gray-500 text-sm font-medium">
                      {{ act.created_at | date:'dd/MM/yyyy' }}
                    </td>
                    <td class="px-6 py-4 align-top pt-4 text-center">
                      <div *ngIf="act.statut === 'en_attente'" class="flex flex-col gap-2">
                        <button (click)="validerActivite(act.id)" class="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors shadow-sm">Valider</button>
                        <button (click)="refuserActivite(act.id)" class="w-full px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors shadow-sm">Refuser</button>
                      </div>
                      <div *ngIf="act.statut === 'valide'" class="mt-1">
                        <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm">
                          <svg class="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                          Validé
                        </span>
                      </div>
                      <div *ngIf="act.statut === 'refuse'" class="mt-1 flex flex-col items-center">
                        <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm mb-1.5">
                          <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          Refusé
                        </span>
                        <span class="text-[10px] text-red-600 font-medium leading-tight max-w-[120px]" [title]="act.motif_refus">Motif: {{ act.motif_refus }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
        </div>
      </div>
    </div>

    <!-- Description Modal -->
    <div *ngIf="showDescModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 class="text-lg font-bold text-gray-900">Description de l'activité</h3>
          <button (click)="closeDescModal()" class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="p-6 text-gray-800 max-h-[60vh] overflow-y-auto">
          <p class="whitespace-pre-wrap leading-relaxed text-sm">{{ selectedDesc }}</p>
        </div>
        <div class="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
          <button (click)="closeDescModal()" class="px-5 py-2 text-sm font-bold text-white bg-esto-primary rounded-lg hover:bg-esto-primary/90 transition-colors shadow-sm">
            Fermer
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfesseurDoctorantsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';
  private storageUrl = 'http://localhost:8000/storage';
  
  doctorants: any[] = [];
  filteredDoctorants: any[] = [];
  uniqueSubjects: string[] = [];
  searchQuery: string = '';
  subjectFilter: string = '';
  isLoading = true;

  // Dossier Modal State
  showDossierModal = false;
  selectedDossier: any = null;

  // Suivi Modal State
  showSuiviModal = false;
  isLoadingSuivi = false;
  activites: any[] = [];
  suiviStats: any = null;

  // Desc Modal State
  showDescModal = false;
  selectedDesc: string = '';

  ngOnInit() {
    this.fetchDoctorants();
  }

  fetchDoctorants() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/professeur/candidatures`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        const all = response.data || [];
        this.doctorants = all.filter((c: any) => c.statut_choix === 'admis');
        this.filteredDoctorants = [...this.doctorants];
        
        const subjects = new Set<string>();
        this.doctorants.forEach(c => {
          if (c.sujet_titre) subjects.add(c.sujet_titre);
        });
        this.uniqueSubjects = Array.from(subjects);
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredDoctorants = this.doctorants.filter(cand => {
      const nom = cand.candidat_nom?.toLowerCase() || '';
      const prenom = cand.candidat_prenom?.toLowerCase() || '';
      const email = cand.candidat_email?.toLowerCase() || '';
      
      const matchSearch = nom.includes(this.searchQuery) || 
                          prenom.includes(this.searchQuery) || 
                          email.includes(this.searchQuery);
                          
      const matchSubject = this.subjectFilter ? cand.sujet_titre === this.subjectFilter : true;
      
      return matchSearch && matchSubject;
    });
  }

  onSearchChange(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.applyFilters();
  }

  onSubjectFilterChange(event: any) {
    this.subjectFilter = event.target.value;
    this.applyFilters();
  }

  openDossierModal(cand: any) {
    this.selectedDossier = cand;
    this.showDossierModal = true;
  }

  closeDossierModal() {
    this.showDossierModal = false;
    this.selectedDossier = null;
  }

  openSuiviModal(cand: any) {
    this.selectedDossier = cand;
    this.showSuiviModal = true;
    this.fetchActivites(cand.candidat_id);
  }

  closeSuiviModal() {
    this.showSuiviModal = false;
    this.activites = [];
    this.suiviStats = null;
  }

  fetchActivites(candidatId: number) {
    this.isLoadingSuivi = true;
    this.http.get<any>(`${this.apiUrl}/professeur/doctorants/${candidatId}/activites`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.activites = response.data.activites;
          this.suiviStats = response.data.stats;
        }
        this.isLoadingSuivi = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoadingSuivi = false;
      }
    });
  }

  formatType(type: string): string {
    if (type === 'Document de conférence') return 'Conference Paper';
    if (type === 'Affiche') return 'Poster';
    return type;
  }


  getHeuresProgress(): number {
    if (!this.suiviStats) return 0;
    const p = (this.suiviStats.total_heures / 200) * 100;
    return p > 100 ? 100 : p;
  }

  getPointsProgress(): number {
    if (!this.suiviStats) return 0;
    const p = (this.suiviStats.total_points / 2.0) * 100;
    return p > 100 ? 100 : p;
  }

  openDescModal(desc: string) {
    this.selectedDesc = desc;
    this.showDescModal = true;
  }

  closeDescModal() {
    this.showDescModal = false;
    this.selectedDesc = '';
  }

  validerActivite(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir valider cette activité ? Les heures/points seront ajoutés au compteur du doctorant.')) return;
    
    this.http.put<any>(`${this.apiUrl}/professeur/activites/${id}/valider`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.fetchActivites(this.selectedDossier.candidat_id);
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur');
      }
    });
  }

  refuserActivite(id: number) {
    const motif = prompt('Veuillez saisir le motif du refus :');
    if (motif === null) return; // User cancelled
    if (motif.trim() === '') {
      alert('Le motif de refus est obligatoire.');
      return;
    }

    this.http.put<any>(`${this.apiUrl}/professeur/activites/${id}/refuser`, { motif }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.fetchActivites(this.selectedDossier.candidat_id);
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur');
      }
    });
  }

  getDocUrl(path: string): string {
    return `${this.storageUrl}/${path}`;
  }
}
