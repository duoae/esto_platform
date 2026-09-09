import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-candidat-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Simple Header -->
      <div class="pb-6 border-b border-gray-100">
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Mon Profil</h1>
        <p class="text-gray-500 mt-1 text-sm">Consultez et modifiez vos informations de contact.</p>
      </div>
      
      <div *ngIf="isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-esto-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div *ngIf="!isLoading && profileData" class="flex flex-col gap-6">
        
        <!-- User Information Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 class="text-xl font-bold text-gray-900 mb-6 border-b border-gray-50 pb-4">Informations Personnelles</h2>
          
          <!-- Photo de profil -->
          <div class="flex items-center gap-6 mb-8">
            <div class="relative group">
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm bg-gray-100 flex items-center justify-center">
                <img [src]="profileData.user?.photo_profil ? getDocUrl(profileData.user.photo_profil) : 'https://ui-avatars.com/api/?name=' + profileData.user?.nom + '+' + profileData.user?.prenom + '&background=f3f4f6&color=4b5563'" 
                     alt="Photo de profil" class="w-full h-full object-cover">
              </div>
              <label class="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <input type="file" class="hidden" accept="image/*" (change)="onPhotoSelected($event)">
              </label>
            </div>
            <div>
              <h3 class="font-bold text-gray-900">Photo de profil</h3>
              <p class="text-xs text-gray-500 mt-1 mb-3">Cliquez sur l'image pour la modifier (JPG, PNG).</p>
              
              <button *ngIf="profileData.user?.photo_profil" (click)="deletePhoto()" class="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center">
                <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                Supprimer
              </button>

              <div *ngIf="isUploadingPhoto" class="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1">
                <svg class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Chargement...
              </div>
            </div>
          </div>
          
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nom Complet</label>
                <div class="text-gray-900 font-medium p-3 bg-gray-50 rounded-xl">{{ profileData.user?.nom }} {{ profileData.user?.prenom }}</div>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Diplôme Obtenu</label>
                <div class="text-gray-900 font-medium p-3 bg-gray-50 rounded-xl">{{ profileData.candidature?.diplome_obtenu }}</div>
              </div>
            </div>

            <!-- Editable fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
              
              <!-- Email -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-bold text-gray-500 uppercase">Email</label>
                  <button *ngIf="!editing.email" (click)="editField('email')" class="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase px-2 py-0.5 bg-blue-50 rounded-md">Modifier</button>
                </div>
                
                <div *ngIf="!editing.email" class="text-gray-900 font-medium p-3 bg-gray-50 border border-transparent rounded-xl">{{ profileData.user?.email }}</div>
                
                <div *ngIf="editing.email" class="flex gap-2">
                  <input type="email" [(ngModel)]="editData.email" class="w-full text-sm text-gray-900 font-medium p-2.5 bg-white border border-gray-200 focus:border-esto-primary outline-none rounded-xl" />
                  <button (click)="saveField('email')" class="px-3 bg-green-500 text-white rounded-xl hover:bg-green-600">✓</button>
                  <button (click)="cancelEdit('email')" class="px-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200">✗</button>
                </div>
              </div>

              <!-- Telephone -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-bold text-gray-500 uppercase">Téléphone</label>
                  <button *ngIf="!editing.telephone" (click)="editField('telephone')" class="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase px-2 py-0.5 bg-blue-50 rounded-md">Modifier</button>
                </div>
                
                <div *ngIf="!editing.telephone" class="text-gray-900 font-medium p-3 bg-gray-50 border border-transparent rounded-xl">{{ profileData.user?.telephone || 'Non spécifié' }}</div>
                
                <div *ngIf="editing.telephone" class="flex gap-2">
                  <input type="text" [(ngModel)]="editData.telephone" class="w-full text-sm text-gray-900 font-medium p-2.5 bg-white border border-gray-200 focus:border-esto-primary outline-none rounded-xl" />
                  <button (click)="saveField('telephone')" class="px-3 bg-green-500 text-white rounded-xl hover:bg-green-600">✓</button>
                  <button (click)="cancelEdit('telephone')" class="px-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200">✗</button>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Security Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div class="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
            <h2 class="text-xl font-bold text-gray-900">Sécurité</h2>
            <button *ngIf="!passwordMode" (click)="passwordMode = true" class="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase px-3 py-1 bg-blue-50 rounded-md">
              Modifier
            </button>
          </div>

          <div *ngIf="!passwordMode" class="text-sm text-gray-500">
            Votre mot de passe est masqué pour des raisons de sécurité.
          </div>

          <div *ngIf="passwordMode" class="space-y-4 max-w-md">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Mot de passe actuel</label>
              <input type="password" [(ngModel)]="passData.current_password" class="w-full text-sm text-gray-900 font-medium p-2.5 bg-white border border-gray-200 outline-none rounded-xl" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nouveau mot de passe</label>
              <input type="password" [(ngModel)]="passData.new_password" class="w-full text-sm text-gray-900 font-medium p-2.5 bg-white border border-gray-200 outline-none rounded-xl" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmer nouveau mot de passe</label>
              <input type="password" [(ngModel)]="passData.new_password_confirmation" class="w-full text-sm text-gray-900 font-medium p-2.5 bg-white border border-gray-200 outline-none rounded-xl" />
            </div>
            <div class="flex gap-2 pt-2">
              <button (click)="passwordMode = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold rounded-xl transition-colors">Annuler</button>
              <button (click)="savePassword()" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors">Enregistrer</button>
            </div>
          </div>
        </div>

        <!-- Documents Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 class="text-xl font-bold text-gray-900 mb-6 border-b border-gray-50 pb-4">Mes Documents</h2>
              <!-- Documents Cards List -->
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
                    <a *ngIf="profileData.candidature?.path_cv" [href]="getDocUrl(profileData.candidature?.path_cv)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!profileData.candidature?.path_cv" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
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
                    <a *ngIf="profileData.candidature?.path_bac" [href]="getDocUrl(profileData.candidature?.path_bac)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!profileData.candidature?.path_bac" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
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
                    <a *ngIf="profileData.candidature?.path_bac2" [href]="getDocUrl(profileData.candidature?.path_bac2)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!profileData.candidature?.path_bac2" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
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
                    <a *ngIf="profileData.candidature?.path_licence" [href]="getDocUrl(profileData.candidature?.path_licence)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!profileData.candidature?.path_licence" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
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
                    <a *ngIf="profileData.candidature?.path_master" [href]="getDocUrl(profileData.candidature?.path_master)" target="_blank" class="px-5 py-2 text-sm font-bold rounded-xl transition-colors bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white">
                      Ouvrir
                    </a>
                    <span *ngIf="!profileData.candidature?.path_master" class="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl italic border border-gray-100">Non fourni</span>
                  </div>
                
              </div>
            
            <div *ngIf="!profileData.candidature?.path_cv && !profileData.candidature?.path_bac && !profileData.candidature?.path_bac2 && !profileData.candidature?.path_licence && !profileData.candidature?.path_master" class="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p class="text-sm text-gray-500 font-medium">Aucun document joint par le candidat.</p>
            </div>
          </div>
        </div>
      </div>
  `
})
export class CandidatProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';
  private storageUrl = 'http://localhost:8000/storage';
  
  profileData: any = null;
  isLoading = true;

  editing = {
    email: false,
    telephone: false
  };

  editData = { email: '', telephone: '' };

  passwordMode = false;
  passData = { current_password: '', new_password: '', new_password_confirmation: '' };

  isUploadingPhoto = false;

  onPhotoSelected(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.uploadPhoto(file);
    }
  }

  uploadPhoto(file: File) {
    this.isUploadingPhoto = true;
    const formData = new FormData();
    formData.append('photo', file);

    this.http.post<any>(`${this.apiUrl}/profil/photo`, formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        const newUrl = res.photo_url || res.data?.photo_profil || res.photo_profil;
        this.profileData.user.photo_profil = newUrl;
        this.isUploadingPhoto = false;
        // Mettre a jour le local storage
        const userStr = localStorage.getItem('esto_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.photo_profil = newUrl;
          localStorage.setItem('esto_user', JSON.stringify(user));
        }
      },
      error: (err) => {
        console.error('Erreur upload photo:', err);
        alert(err.error?.message || "Erreur lors du téléchargement de la photo.");
        this.isUploadingPhoto = false;
      }
    });
  }

  deletePhoto() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) return;

    this.isUploadingPhoto = true;
    this.http.delete<any>(`${this.apiUrl}/profil/photo`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: () => {
        this.profileData.user.photo_profil = null;
        this.isUploadingPhoto = false;
        const userStr = localStorage.getItem('esto_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.photo_profil = null;
          localStorage.setItem('esto_user', JSON.stringify(user));
        }
      },
      error: (err) => {
        console.error('Erreur suppression photo:', err);
        alert(err.error?.message || "Erreur lors de la suppression de la photo.");
        this.isUploadingPhoto = false;
      }
    });
  }

  ngOnInit() {
    this.fetchProfile();
  }

  fetchProfile() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/candidat/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.profileData = response;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil:', err);
        this.isLoading = false;
      }
    });
  }

  editField(field: 'email' | 'telephone') {
    this.editing[field] = true;
    this.editData[field] = this.profileData.user[field] || '';
  }

  cancelEdit(field: 'email' | 'telephone') {
    this.editing[field] = false;
  }

  saveField(field: 'email' | 'telephone') {
    const payload = {};
    // @ts-ignore
    payload[field] = this.editData[field];

    this.http.put<any>(`${this.apiUrl}/profil`, payload, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        this.profileData.user[field] = this.editData[field];
        this.editing[field] = false;
      },
      error: (err) => {
        alert(err.error?.message || "Erreur lors de la mise à jour");
      }
    });
  }

  savePassword() {
    if (this.passData.new_password !== this.passData.new_password_confirmation) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }
    
    this.http.put<any>(`${this.apiUrl}/profil/password`, this.passData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        alert("Mot de passe mis à jour avec succès !");
        this.passwordMode = false;
        this.passData = { current_password: '', new_password: '', new_password_confirmation: '' };
      },
      error: (err) => {
        alert(err.error?.message || "Erreur lors de la mise à jour du mot de passe");
      }
    });
  }

  getDocUrl(path: string): string {
    return `${this.storageUrl}/${path}`;
  }
}
