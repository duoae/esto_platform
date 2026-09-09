import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-directeur-professeurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './directeur-professeurs.component.html'
})
export class DirecteurProfesseursComponent implements OnInit {
  professeurs: any[] = [];
  isLoading = true;
  user: any = null;
  searchQuery = '';

  get filteredProfesseurs() {
    if (!this.searchQuery) return this.professeurs;
    const query = this.searchQuery.toLowerCase();
    return this.professeurs.filter(prof => 
      (prof.name && prof.name.toLowerCase().includes(query)) ||
      (prof.nom && prof.nom.toLowerCase().includes(query)) ||
      (prof.prenom && prof.prenom.toLowerCase().includes(query)) ||
      (prof.email && prof.email.toLowerCase().includes(query)) ||
      (prof.details?.specialite && prof.details.specialite.toLowerCase().includes(query)) ||
      (prof.specialite && prof.specialite.toLowerCase().includes(query))
    );
  }

  isModalOpen = false;
  isSaving = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  isEditing = false;
  editingProfId: number | null = null;
  successMessage = '';
  showConfirmDeleteModal = false;
  profToDelete: any = null;
  isDeleting = false;
  
  formData: any = {
    name: '',
    email: '',
    phone: '',
    specialite: '',
    grade: '',
    password: '',
    password_confirmation: '',
    role: 'professeur',
    lab_id: null
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    const userStr = localStorage.getItem('esto_user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      this.formData.lab_id = this.user.laboratoire_id;
      if (this.user.laboratoire_id) {
        this.loadProfesseurs(this.user.laboratoire_id);
      } else {
        this.isLoading = false;
      }
    }
  }

  loadProfesseurs(labId: number) {
    this.isLoading = true;
    this.apiService.getLabMembers(labId).subscribe({
      next: (res: any) => {
        const members = res.data || res;
        if (Array.isArray(members)) {
          this.professeurs = members.filter(m => m.role?.toLowerCase() === 'professeur' || m.role?.toLowerCase() === 'directeur');
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading professeurs', err);
        this.isLoading = false;
      }
    });
  }

  getMemberInitials(member: any): string {
    if (member?.name) return member.name.substring(0, 2).toUpperCase();
    if (member?.nom) return (member.nom.charAt(0) + (member.prenom ? member.prenom.charAt(0) : '')).toUpperCase();
    return 'PR';
  }

  openModal() {
    this.formData = {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'professeur',
      lab_id: this.user?.laboratoire_id
    };
    this.errorMessage = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.isEditing = false;
    this.editingProfId = null;
    this.successMessage = '';
    this.isModalOpen = true;
  }

  editProfesseur(prof: any) {
    this.formData = {
      name: prof.name || (prof.nom + ' ' + prof.prenom),
      email: prof.email,
      phone: prof.phone || prof.telephone || '',
      specialite: prof.details?.specialite || prof.specialite || '',
      grade: prof.details?.grade || prof.grade || '',
      password: '',
      password_confirmation: '',
      role: 'professeur',
      lab_id: this.user?.laboratoire_id
    };
    this.errorMessage = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.isEditing = true;
    this.editingProfId = prof.id;
    this.successMessage = '';
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  saveProfesseur() {
    this.errorMessage = '';
    if (!this.formData.name || !this.formData.email) return;
    if (!this.isEditing && (!this.formData.password || this.formData.password !== this.formData.password_confirmation)) return;
    if (this.isEditing && this.formData.password && this.formData.password !== this.formData.password_confirmation) return;
    
    this.isSaving = true;
    const request = this.isEditing 
      ? this.apiService.updateUser(this.editingProfId!, this.formData)
      : this.apiService.createUser(this.formData);

    request.subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.closeModal();
        this.successMessage = this.isEditing ? 'Professeur modifié avec succès.' : 'Professeur ajouté avec succès.';
        if (this.user?.laboratoire_id) {
          this.loadProfesseurs(this.user.laboratoire_id);
        }
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err: any) => {
        console.error('Error saving professeur', err);
        if (err.status === 422) {
          // Typically email already taken
          this.errorMessage = "Cet e-mail est déjà utilisé par un autre utilisateur.";
        } else {
          this.errorMessage = "Une erreur est survenue. Veuillez réessayer.";
        }
        this.isSaving = false;
      }
    });
  }

  deleteProfesseur(prof: any) {
    this.profToDelete = prof;
    this.showConfirmDeleteModal = true;
  }

  closeConfirmDeleteModal() {
    this.showConfirmDeleteModal = false;
    this.profToDelete = null;
    this.isDeleting = false;
  }

  confirmDelete() {
    if (!this.profToDelete) return;
    this.isDeleting = true;
    this.apiService.deleteUser(this.profToDelete.id).subscribe({
      next: () => {
        this.successMessage = 'Professeur retiré avec succès.';
        this.isDeleting = false;
        this.closeConfirmDeleteModal();
        if (this.user?.laboratoire_id) {
          this.loadProfesseurs(this.user.laboratoire_id);
        }
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err: any) => {
        console.error('Error deleting professeur', err);
        this.errorMessage = "Erreur lors de la suppression du professeur.";
        this.isDeleting = false;
        this.closeConfirmDeleteModal();
      }
    });
  }
}
