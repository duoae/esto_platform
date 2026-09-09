import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-directeurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './directeurs.component.html',
})
export class DirecteursComponent implements OnInit {
  private apiService = inject(ApiService);

  directeurs: any[] = [];
  laboratoires: any[] = [];
  isLoading = false;

  isModalOpen = false;
  isEditing = false;
  currentDirecteurId: number | null = null;
  showConfirmModal = false;
  userToDelete: number | null = null;
  
  formData = {
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'directeur',
    laboratoire_id: null as number | null
  };

  ngOnInit() {
    this.loadDirecteurs();
    this.loadLaboratoires();
  }

  loadDirecteurs() {
    this.isLoading = true;
    this.apiService.getUsersByRole('directeur').subscribe({
      next: (res) => {
        // Handle Laravel's double data wrapping if present
        let extractedData = res.data || res;
        if (extractedData && extractedData.data && Array.isArray(extractedData.data)) {
          extractedData = extractedData.data;
        }
        this.directeurs = extractedData;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement directeurs', err);
        this.isLoading = false;
      }
    });
  }

  loadLaboratoires() {
    this.apiService.getLabs().subscribe({
      next: (res) => {
        let extractedData = res.data || res;
        if (extractedData && extractedData.data && Array.isArray(extractedData.data)) {
          extractedData = extractedData.data;
        }
        this.laboratoires = extractedData;
      },
      error: (err) => {
        console.error('Erreur chargement laboratoires', err);
      }
    });
  }

  openModal(directeur?: any) {
    if (directeur) {
      this.isEditing = true;
      this.currentDirecteurId = directeur.id;
      const nameParts = (directeur.name || '').split(' ');
      const prenom = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      this.formData = {
        nom: nameParts[0] || '',
        prenom: prenom,
        email: directeur.email,
        password: '', // Leave empty for edit
        confirmPassword: '',
        role: 'directeur',
        laboratoire_id: directeur.lab_id ? Number(directeur.lab_id) : null
      };
    } else {
      this.isEditing = false;
      this.currentDirecteurId = null;
      this.formData = {
        nom: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'directeur',
        laboratoire_id: null
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.currentDirecteurId = null;
  }

  saveDirecteur() {
    if (this.formData.password !== this.formData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }

    // Map formData to what the backend expects (name instead of nom/prenom, lab_id instead of laboratoire_id)
    const dataToSend: any = { 
      name: `${this.formData.nom} ${this.formData.prenom}`.trim(),
      email: this.formData.email,
      role: 'directeur',
      lab_id: this.formData.laboratoire_id ? String(this.formData.laboratoire_id) : null
    };

    if (!this.isEditing || (this.formData.password && this.formData.password.trim() !== '')) {
      dataToSend.password = this.formData.password;
    }

    if (this.isEditing && this.currentDirecteurId) {
      this.apiService.updateUser(this.currentDirecteurId, dataToSend).subscribe({
        next: () => {
          this.loadDirecteurs();
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          const errors = err.error?.errors || {};
          alert('Erreur: ' + JSON.stringify(errors));
        }
      });
    } else {
      this.apiService.createUser(dataToSend).subscribe({
        next: () => {
          this.loadDirecteurs();
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          const errors = err.error?.errors || {};
          alert('Erreur: ' + JSON.stringify(errors));
        }
      });
    }
  }

  deleteDirecteur(id: number) {
    this.userToDelete = id;
    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.userToDelete = null;
  }

  confirmDelete() {
    if (this.userToDelete) {
      this.apiService.deleteUser(this.userToDelete).subscribe({
        next: () => {
          this.loadDirecteurs();
          this.closeConfirmModal();
        },
        error: (err) => {
          console.error(err);
          alert('Erreur lors de la suppression.');
          this.closeConfirmModal();
        }
      });
    }
  }
}
