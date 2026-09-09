import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-professeur-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './professeur-profile.component.html'
})
export class ProfesseurProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';
  storageUrl = 'http://localhost:8000/storage';
  
  profileData: any = null;
  isLoading = true;

  editMode = false;
  editData = {
    nom: '',
    prenom: '',
    telephone: '',
    specialite: ''
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
  isUploading = false;

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
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil:', err);
        this.isLoading = false;
      }
    });
  }

  startEdit() {
    this.editData = {
      nom: this.profileData?.nom || '',
      prenom: this.profileData?.prenom || '',
      telephone: this.profileData?.telephone || '',
      specialite: this.profileData?.specialite || ''
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

  onPhotoSelected(event: any) {
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
    return this.profileData?.photo_profil ? `${this.storageUrl}/${this.profileData.photo_profil}` : null;
  }

  saveProfile() {
    this.clearMessages();
    
    if (!this.editData.nom || !this.editData.prenom) {
      this.errorMessage = "Le nom et le prénom sont obligatoires.";
      return;
    }

    this.isSaving = true;
    this.http.put<any>(`${this.apiUrl}/profil`, this.editData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (res) => {
        this.profileData = res.user || res.data || res;
        
        const updateLocalStorage = () => {
          const userStr = localStorage.getItem('esto_user');
          if(userStr) {
             let u = JSON.parse(userStr);
             u.name = this.profileData.nom + ' ' + this.profileData.prenom;
             u.nom = this.profileData.nom;
             u.prenom = this.profileData.prenom;
             u.specialite = this.profileData.specialite;
             if (this.profileData.photo_profil) {
               u.photo_profil = this.profileData.photo_profil;
             }
             localStorage.setItem('esto_user', JSON.stringify(u));
             window.dispatchEvent(new Event('profileUpdated'));
          }
        };

        updateLocalStorage();

        if (this.selectedFile) {
          const formData = new FormData();
          formData.append('photo', this.selectedFile);
          
          this.http.post<any>(`${this.apiUrl}/profil/photo`, formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
          }).subscribe({
            next: (photoRes) => {
              this.profileData.photo_profil = photoRes.path || photoRes.photo_profil || photoRes.data?.photo_profil || this.profileData.photo_profil;
              updateLocalStorage();
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

  deletePhoto() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) return;

    this.isUploading = true;
    this.http.delete<any>(`${this.apiUrl}/profil/photo`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: () => {
        this.profileData.photo_profil = null;
        this.isUploading = false;
        const userStr = localStorage.getItem('esto_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.photo_profil = null;
          localStorage.setItem('esto_user', JSON.stringify(user));
          window.dispatchEvent(new Event('profileUpdated'));
        }
        this.successMessage = 'Photo de profil supprimée avec succès.';
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression de la photo.';
        this.isUploading = false;
      }
    });
  }
}
