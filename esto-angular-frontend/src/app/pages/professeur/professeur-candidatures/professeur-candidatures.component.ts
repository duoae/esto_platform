import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-professeur-candidatures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Candidatures reçues</h1>
          <p class="text-gray-500 mt-1 text-sm">Consultez les candidatures déposées pour les sujets que vous proposez.</p>
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

      <div *ngIf="!isLoading && filteredCandidats.length === 0" class="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900">Aucune candidature</h3>
        <p class="text-gray-500 text-sm mt-1 max-w-sm mb-6">Vous n'avez pas encore reçu de candidatures pour vos sujets.</p>
      </div>

      <div *ngIf="!isLoading && filteredCandidats.length > 0" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600">
            <thead class="bg-gray-50/50 text-gray-500 border-b border-gray-100">
              <tr>
                <th class="px-6 py-4 font-bold w-[25%]">Candidat</th>
                <th class="px-6 py-4 font-bold w-[25%]">Diplôme & Labo</th>
                <th class="px-6 py-4 font-bold w-[25%]">Sujet postulé</th>
                <th class="px-6 py-4 font-bold text-center w-[12%]">Documents</th>
                <th class="px-6 py-4 font-bold text-right w-[13%]">Décision</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr *ngFor="let cand of filteredCandidats" class="hover:bg-gray-50/50 transition-colors group">
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
                <td class="px-6 py-4 text-center">
                  <button (click)="openDossierModal(cand)" class="inline-flex items-center text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg py-2 px-3 transition-colors shadow-sm border border-orange-100">
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Voir dossier
                  </button>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end">
                    <select [(ngModel)]="cand.statut_choix" (ngModelChange)="onStatusChange(cand, $event)" class="text-xs font-bold rounded-lg shadow-sm py-2 pl-3 pr-8 w-36 outline-none transition-all cursor-pointer border"
                            [ngClass]="{
                              'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100': cand.statut_choix === 'en_attente',
                              'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100': cand.statut_choix === 'pre_selectionne',
                              'bg-green-50 text-green-700 border-green-200 hover:bg-green-100': cand.statut_choix === 'accepte' || cand.statut_choix === 'admis',
                              'bg-red-50 text-red-700 border-red-200 hover:bg-red-100': cand.statut_choix === 'refuse'
                            }">
                      <option value="en_attente">En attente</option>
                      <option value="pre_selectionne">Pré-sélectionné</option>
                      <option value="accepte">Accepté</option>
                      <option value="admis">Admis</option>
                      <option value="refuse">Refusé</option>
                    </select>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Notification Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 class="text-lg font-bold text-gray-900">Contacter le candidat</h3>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="p-6">
          <p class="text-sm text-gray-500 mb-4">
            Destinataire : <strong class="text-gray-900">{{ selectedCandidat?.candidat_nom }} {{ selectedCandidat?.candidat_prenom }}</strong>
          </p>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Objet du message</label>
              <select [(ngModel)]="notificationType" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-esto-primary focus:ring focus:ring-esto-primary/20 text-sm">
                <option value="Document Manquant">Document Manquant</option>
                <option value="Mise à jour Dossier">Mise à jour Dossier</option>
                <option value="Information">Information diverse</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Message</label>
              <textarea [(ngModel)]="notificationMessage" rows="4" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-esto-primary focus:ring focus:ring-esto-primary/20 text-sm" placeholder="Rédigez votre message ici..."></textarea>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button (click)="closeModal()" class="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button (click)="sendNotification()" [disabled]="isSending" class="px-4 py-2 text-sm font-bold text-white bg-esto-primary rounded-lg hover:bg-esto-primary/90 transition-colors flex items-center">
            <svg *ngIf="isSending" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Envoyer
          </button>
        </div>
      </div>
    </div>

    <!-- Convocation Modal (Auto-triggered when Pre-selectionne) -->
    <div *ngIf="showConvocationModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
        <div class="px-6 py-4 border-b border-blue-100 flex justify-between items-center bg-blue-50/50">
          <h3 class="text-lg font-bold text-blue-900 flex items-center">
            <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Programmer l'entretien
          </h3>
          <button (click)="cancelConvocation()" class="text-gray-400 hover:text-gray-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="p-6">
          <p class="text-sm text-gray-500 mb-4">
            Vous avez présélectionné <strong class="text-gray-900">{{ convocationCandidat?.candidat_nom }} {{ convocationCandidat?.candidat_prenom }}</strong>. Veuillez saisir les détails de la convocation qui lui sera envoyée automatiquement.
          </p>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Date</label>
                <input type="date" [(ngModel)]="convocationDate" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-esto-primary focus:ring focus:ring-esto-primary/20 text-sm">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Heure</label>
                <input type="time" [(ngModel)]="convocationTime" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-esto-primary focus:ring focus:ring-esto-primary/20 text-sm">
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Lieu / Salle</label>
              <input type="text" [(ngModel)]="convocationLieu" placeholder="Ex: Salle de réunion Labo, Teams..." class="w-full rounded-lg border-gray-300 shadow-sm focus:border-esto-primary focus:ring focus:ring-esto-primary/20 text-sm">
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button (click)="cancelConvocation()" class="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button (click)="validerConvocation()" [disabled]="isSendingConvocation" class="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <svg *ngIf="isSendingConvocation" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Valider la décision
          </button>
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
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                      {{ selectedDossier?.statut_choix }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Documents -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Documents du candidat</h4>
                
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
                    <a *ngIf="selectedDossier?.cv_path" [href]="getDocUrl(selectedDossier?.cv_path)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!selectedDossier?.cv_path" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
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
                    <a *ngIf="selectedDossier?.bac_path" [href]="getDocUrl(selectedDossier?.bac_path)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!selectedDossier?.bac_path" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
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
                    <a *ngIf="selectedDossier?.bac2_path" [href]="getDocUrl(selectedDossier?.bac2_path)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!selectedDossier?.bac2_path" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
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
                    <a *ngIf="selectedDossier?.licence_path" [href]="getDocUrl(selectedDossier?.licence_path)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!selectedDossier?.licence_path" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
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
                    <a *ngIf="selectedDossier?.master_path" [href]="getDocUrl(selectedDossier?.master_path)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!selectedDossier?.master_path" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
                  </div>
                  
                </div>
              </div>
              
              
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfesseurCandidaturesComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';
  private storageUrl = 'http://localhost:8000/storage';
  
  candidatures: any[] = [];
  filteredCandidats: any[] = [];
  uniqueSubjects: string[] = [];
  searchQuery: string = '';
  subjectFilter: string = '';
  isLoading = true;
  showModal = false;
  selectedCandidat: any = null;
  notificationType = 'Convocation Entretien';
  notificationMessage = '';
  isSending = false;

  // Dossier Modal State
  showDossierModal = false;
  selectedDossier: any = null;

  // Convocation Modal State
  showConvocationModal = false;
  convocationCandidat: any = null;
  convocationDate = '';
  convocationTime = '';
  convocationLieu = '';
  convocationMessage = '';
  isSendingConvocation = false;
  previousStatusMap = new Map<number, string>(); // To revert status if cancelled

  ngOnInit() {
    this.fetchCandidatures();
  }

  fetchCandidatures() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/professeur/candidatures`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.candidatures = response.data || [];
        this.filteredCandidats = [...this.candidatures];
        
        // Extract unique subject titles for the filter dropdown
        const subjects = new Set<string>();
        this.candidatures.forEach(c => {
          if (c.sujet_titre) subjects.add(c.sujet_titre);
        });
        this.uniqueSubjects = Array.from(subjects);

        // Store initial statuses
        this.candidatures.forEach(c => this.previousStatusMap.set(c.choix_id, c.statut_choix));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des candidatures:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredCandidats = this.candidatures.filter(cand => {
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

  onStatusChange(cand: any, newStatus: string) {
    if (newStatus === 'pre_selectionne') {
      // Intercept and show convocation modal instead of updating immediately
      this.convocationCandidat = cand;
      this.convocationDate = '';
      this.convocationTime = '';
      this.convocationLieu = '';
      this.showConvocationModal = true;
    } else {
      // Normal update for other statuses
      cand.statut_choix = newStatus;
      this.updateStatus(cand);
    }
  }

  cancelConvocation() {
    // Revert select dropdown to previous state
    if (this.convocationCandidat) {
      this.convocationCandidat.statut_choix = this.previousStatusMap.get(this.convocationCandidat.choix_id) || 'en_attente';
    }
    this.showConvocationModal = false;
    this.convocationCandidat = null;
  }

  validerConvocation() {
    if (!this.convocationDate || !this.convocationTime || !this.convocationLieu) {
      alert('Veuillez remplir la date, l\'heure et le lieu.');
      return;
    }

    this.isSendingConvocation = true;
    const message = `Félicitations, votre dossier a été présélectionné pour le sujet "${this.convocationCandidat.sujet_titre}". Vous êtes convoqué à un entretien le ${this.convocationDate} à ${this.convocationTime}.\n\nLieu : ${this.convocationLieu}`;

    // 1. Update status to pre_selectionne
    this.http.put<any>(`${this.apiUrl}/professeur/candidatures/choix/${this.convocationCandidat.choix_id}/status`, { 
      statut_choix: 'pre_selectionne',
      convocation_date: this.convocationDate,
      convocation_time: this.convocationTime,
      convocation_lieu: this.convocationLieu
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: () => {
        // Update local memory of previous status
        this.previousStatusMap.set(this.convocationCandidat.choix_id, 'pre_selectionne');
        
        // 2. Send notification
        this.http.post<any>(`${this.apiUrl}/professeur/candidatures/${this.convocationCandidat.candidat_id}/notify`, {
          type: 'Convocation Entretien',
          message: message
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
        }).subscribe({
          next: () => {
            alert('Candidat présélectionné et convocation envoyée avec succès !');
            this.isSendingConvocation = false;
            this.showConvocationModal = false;
            this.convocationCandidat = null;
          },
          error: (err) => {
            console.error('Erreur notification:', err);
            alert('Le statut a été mis à jour mais la notification a échoué.');
            this.isSendingConvocation = false;
            this.showConvocationModal = false;
          }
        });
      },
      error: (err) => {
        console.error('Erreur mise à jour statut:', err);
        alert('Erreur lors de la mise à jour du statut.');
        this.isSendingConvocation = false;
      }
    });
  }

  updateStatus(cand: any) {
    this.http.put<any>(`${this.apiUrl}/professeur/candidatures/choix/${cand.choix_id}/status`, { statut_choix: cand.statut_choix }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        // Update local memory
        this.previousStatusMap.set(cand.choix_id, cand.statut_choix);
        console.log(response.message);
      },
      error: (err) => {
        console.error('Erreur de mise à jour:', err);
        // Revert on error
        cand.statut_choix = this.previousStatusMap.get(cand.choix_id) || 'en_attente';
        alert('Erreur lors de la mise à jour du statut.');
      }
    });
  }

  openNotificationModal(cand: any) {
    this.selectedCandidat = cand;
    this.notificationType = 'Information';
    this.notificationMessage = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedCandidat = null;
  }

  openDossierModal(cand: any) {
    this.selectedDossier = cand;
    this.showDossierModal = true;
  }

  closeDossierModal() {
    this.showDossierModal = false;
    this.selectedDossier = null;
  }

  sendNotification() {
    if (!this.notificationMessage.trim()) {
      alert("Veuillez saisir un message.");
      return;
    }

    this.isSending = true;
    this.http.post<any>(`${this.apiUrl}/professeur/candidatures/${this.selectedCandidat.candidat_id}/notify`, {
      type: this.notificationType,
      message: this.notificationMessage
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        alert("Notification envoyée avec succès.");
        this.isSending = false;
        this.closeModal();
      },
      error: (err) => {
        console.error("Erreur lors de l'envoi:", err);
        alert("Une erreur s'est produite lors de l'envoi.");
        this.isSending = false;
      }
    });
  }

  getDocUrl(path: string): string {
    return `${this.storageUrl}/${path}`;
  }
}
