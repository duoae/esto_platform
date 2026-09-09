import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-directeur-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './directeur-profile.component.html'
})
export class DirecteurProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private apiUrl = 'http://localhost:8000/api';
  
  profileData: any = null;
  lab: any = null;
  isLoading = true;

  editMode = false;
  editData = {
    nom: '',
    prenom: '',
    telephone: ''
  };

  passwordMode = false;
  passwordData = {
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  };

  successMessage = '';
  errorMessage = '';
  isSaving = false;

  ngOnInit() {
    this.fetchProfile();
  }

  fetchProfile() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/profil`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.profileData = response.data || response.user || response;
        if (this.profileData.laboratoire_id) {
          this.loadLabDetails(this.profileData.laboratoire_id);
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil:', err);
        this.isLoading = false;
      }
    });
  }

  loadLabDetails(id: number) {
    this.apiService.getLab(id).subscribe({
      next: (res: any) => {
        this.lab = res.data || res;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading lab details', err);
        this.isLoading = false;
      }
    });
  }

  startEdit() {
    this.editData = {
      nom: this.profileData?.nom || '',
      prenom: this.profileData?.prenom || '',
      telephone: this.profileData?.telephone || ''
    };
    this.editMode = true;
    this.passwordMode = false;
    this.clearMessages();
  }

  cancelEdit() {
    this.editMode = false;
    this.clearMessages();
  }

  startPassword() {
    this.passwordData = { current_password: '', new_password: '', new_password_confirmation: '' };
    this.passwordMode = true;
    this.editMode = false;
    this.clearMessages();
  }

  cancelPassword() {
    this.passwordMode = false;
    this.clearMessages();
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  selectedFile: File | null = null;
  photoPreview: string | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  getPhotoUrl() {
    return this.profileData?.photo_profil ? `http://localhost:8000/storage/${this.profileData.photo_profil}` : null;
  }

  updateLocalStorageUser() {
    const userStr = localStorage.getItem('esto_user');
    if(userStr) {
       let u = JSON.parse(userStr);
       u.name = this.profileData.nom + ' ' + this.profileData.prenom;
       if (this.profileData.photo_profil) {
         u.photo_profil = this.profileData.photo_profil;
       }
       localStorage.setItem('esto_user', JSON.stringify(u));
    }
  }

  saveProfile() {
    this.isSaving = true;
    this.clearMessages();
    this.http.put<any>(`${this.apiUrl}/profil`, this.editData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        this.profileData = res.user || res.data || res;
        this.updateLocalStorageUser();

        if (this.selectedFile) {
          const formData = new FormData();
          formData.append('photo', this.selectedFile);
          
          this.http.post<any>(`${this.apiUrl}/profil/photo`, formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
          }).subscribe({
            next: (photoRes) => {
              this.profileData.photo_profil = photoRes.path || photoRes.photo_profil || photoRes.data?.photo_profil || this.profileData.photo_profil;
              this.updateLocalStorageUser();
              this.successMessage = 'Profil et photo mis à jour avec succès.';
              this.editMode = false;
              this.isSaving = false;
              this.selectedFile = null;
              this.photoPreview = null;
            },
            error: (err) => {
              this.errorMessage = 'Profil mis à jour mais erreur lors de l\'upload de la photo.';
              this.editMode = false;
              this.isSaving = false;
            }
          });
        } else {
          this.successMessage = 'Profil mis à jour avec succès.';
          this.editMode = false;
          this.isSaving = false;
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour du profil.';
        this.isSaving = false;
      }
    });
  }

  savePassword() {
    if (this.passwordData.new_password !== this.passwordData.new_password_confirmation) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }
    
    this.isSaving = true;
    this.clearMessages();
    this.http.put<any>(`${this.apiUrl}/profil/password`, this.passwordData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        this.successMessage = 'Mot de passe modifié avec succès.';
        this.passwordMode = false;
        this.isSaving = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors du changement de mot de passe.';
        this.isSaving = false;
      }
    });
  }
}
