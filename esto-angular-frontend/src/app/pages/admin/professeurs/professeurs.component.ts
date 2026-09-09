import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-professeurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './professeurs.component.html',
})
export class ProfesseursComponent implements OnInit {
  private apiService = inject(ApiService);

  professeurs: any[] = [];
  laboratoires: any[] = [];
  isLoading = false;

  isModalOpen = false;
  isEditing = false;
  currentProfesseurId: number | null = null;
  
  viewModalOpen = false;
  selectedProfesseur: any = null;
  
  formData = {
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'professeur',
    laboratoire_id: null as number | null
  };

  searchQuery = '';
  selectedLabId: number | '' = '';

  get filteredProfesseurs() {
    return this.professeurs.filter(prof => {
      const matchesSearch = !this.searchQuery || 
                            prof.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                            prof.email?.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesLab = this.selectedLabId ? String(prof.laboratoire_id) === String(this.selectedLabId) : true;
      return matchesSearch && matchesLab;
    });
  }

  ngOnInit() {
    this.loadProfesseurs();
    this.loadLaboratoires();
  }

  loadProfesseurs() {
    this.isLoading = true;
    this.apiService.getUsersByRole('professeur').subscribe({
      next: (res) => {
        // Handle Laravel's double data wrapping if present
        let extractedData = res.data || res;
        if (extractedData && extractedData.data && Array.isArray(extractedData.data)) {
          extractedData = extractedData.data;
        }
        this.professeurs = extractedData;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement professeurs', err);
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

  openModal(professeur?: any) {
    if (professeur) {
      this.isEditing = true;
      this.currentProfesseurId = professeur.id;
      const nameParts = (professeur.name || '').split(' ');
      const prenom = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      this.formData = {
        nom: nameParts[0] || '',
        prenom: prenom,
        email: professeur.email,
        password: '', // Leave empty for edit
        confirmPassword: '',
        role: 'professeur',
        laboratoire_id: professeur.lab_id ? Number(professeur.lab_id) : null
      };
    } else {
      this.isEditing = false;
      this.currentProfesseurId = null;
      this.formData = {
        nom: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'professeur',
        laboratoire_id: null
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.currentProfesseurId = null;
  }

  openViewModal(professeur: any) {
    this.selectedProfesseur = professeur;
    this.viewModalOpen = true;
  }

  closeViewModal() {
    this.viewModalOpen = false;
    this.selectedProfesseur = null;
  }

  saveProfesseur() {
    if (this.formData.password !== this.formData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }

    // Map formData to what the backend expects (name instead of nom/prenom, lab_id instead of laboratoire_id)
    const dataToSend: any = { 
      name: `${this.formData.nom} ${this.formData.prenom}`.trim(),
      email: this.formData.email,
      role: 'professeur',
      lab_id: this.formData.laboratoire_id ? String(this.formData.laboratoire_id) : null
    };

    if (!this.isEditing || (this.formData.password && this.formData.password.trim() !== '')) {
      dataToSend.password = this.formData.password;
    }

    if (this.isEditing && this.currentProfesseurId) {
      this.apiService.updateUser(this.currentProfesseurId, dataToSend).subscribe({
        next: () => {
          this.loadProfesseurs();
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
          this.loadProfesseurs();
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

  deleteProfesseur(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce professeur ?')) {
      this.apiService.deleteUser(id).subscribe({
        next: () => {
          this.loadProfesseurs();
        },
        error: (err) => {
          console.error(err);
          alert('Erreur lors de la suppression.');
        }
      });
    }
  }
}
