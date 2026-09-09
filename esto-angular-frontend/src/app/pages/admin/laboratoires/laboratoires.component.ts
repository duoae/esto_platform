import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-laboratoires',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './laboratoires.component.html',
})
export class LaboratoiresComponent implements OnInit {
  private apiService = inject(ApiService);

  laboratoires: any[] = [];
  isLoading = true;
  isModalOpen = false;
  isViewModalOpen = false;
  isEditing = false;
  currentLabId: number | null = null;
  showConfirmModal = false;
  labToDelete: number | null = null;
  formData: any = {
    nom: '',
    acronyme: '',
    etablissement: '',
    locaux: '',
    thematiques: [],
    director_name: '',
    director_title: '',
    director_email: '',
    director_phone: '',
    adjoint_name: '',
    adjoint_title: '',
    adjoint_email: '',
    adjoint_phone: '',
    equipes: []
  };
  
  thematiquesText: string = '';
  viewedLab: any = null;
  viewedLabIndex: number = 0;

  ngOnInit() {
    this.loadLabs();
  }

  getBadgeColor(index: number): string {
    const colors = [
      'bg-emerald-100 text-emerald-600',
      'bg-blue-100 text-blue-600',
      'bg-fuchsia-100 text-fuchsia-600',
      'bg-cyan-100 text-cyan-700',
      'bg-violet-100 text-violet-600',
      'bg-lime-100 text-lime-700'
    ];
    return colors[index % colors.length];
  }

  loadLabs() {
    this.isLoading = true;
    this.apiService.getLabs().subscribe({
      next: (res) => {
        this.laboratoires = res.data || res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement laboratoires', err);
        this.isLoading = false;
      }
    });
  }

  viewLab(id: number) {
    this.viewedLabIndex = Math.max(0, this.laboratoires.findIndex(l => l.id === id));
    this.apiService.getLab(id).subscribe({
      next: (data) => {
        this.viewedLab = data.data ? data.data : data;
        this.isViewModalOpen = true;
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors du chargement des détails du laboratoire.');
      }
    });
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.viewedLab = null;
  }

  addEquipe() {
    this.formData.equipes.push({
      nom: '',
      coordinateur: '',
      thematique: '',
      axesText: ''
    });
  }

  removeEquipe(index: number) {
    this.formData.equipes.splice(index, 1);
  }

  openModal(lab: any = null) {
    if (lab) {
      this.isEditing = true;
      this.currentLabId = lab.id;
      this.formData = { ...lab };
      this.formData.nom = lab.name || lab.nom;
      this.formData.acronyme = lab.acronym || lab.acronyme;
      this.formData.etablissement = lab.establishment || lab.etablissement;
      this.formData.equipes = (lab.equipes || []).map((eq: any) => ({
        ...eq,
        axesText: eq.axes ? eq.axes.map((a: any) => a.nom).join('\n') : ''
      }));
      this.thematiquesText = lab.themes ? lab.themes.join('\n') : '';
    } else {
      this.isEditing = false;
      this.currentLabId = null;
      this.formData = { 
        nom: '', acronyme: '', etablissement: "Ecole Supérieure de Technologie d'Oujda (ESTO)", locaux: '', thematiques: [],
        director_name: '', director_title: '', director_email: '', director_phone: '',
        adjoint_name: '', adjoint_title: '', adjoint_email: '', adjoint_phone: '',
        equipes: []
      };
      this.thematiquesText = '';
      this.addEquipe(); // Add one empty equipe by default
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveLab() {
    // Process thematiquesText into array
    this.formData.thematiques = this.thematiquesText
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);
      
    // Process axesText for each equipe
    this.formData.equipes.forEach((eq: any) => {
      if (eq.axesText) {
        eq.axes = eq.axesText.split('\n').map((a: string) => a.trim()).filter((a: string) => a.length > 0);
      } else {
        eq.axes = [];
      }
    });

    // Remove empty equipes before submitting
    this.formData.equipes = this.formData.equipes.filter((eq: any) => eq.nom && eq.nom.trim() !== '');

    if (this.isEditing && this.currentLabId) {
      this.apiService.updateLab(this.currentLabId, this.formData).subscribe({
        next: () => {
          this.loadLabs();
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          let msg = 'Erreur lors de la modification.';
          if (err.error && err.error.errors) {
            msg += '\n' + JSON.stringify(err.error.errors, null, 2);
          }
          alert(msg);
        }
      });
    } else {
      this.apiService.createLab(this.formData).subscribe({
        next: () => {
          this.loadLabs();
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          let msg = 'Erreur lors de la création.';
          if (err.error && err.error.errors) {
            msg += '\\n' + JSON.stringify(err.error.errors, null, 2);
          }
          alert(msg);
        }
      });
    }
  }

  deleteLab(id: number) {
    this.labToDelete = id;
    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.labToDelete = null;
  }

  confirmDelete() {
    if (this.labToDelete) {
      this.apiService.deleteLab(this.labToDelete).subscribe({
        next: () => {
          this.loadLabs();
          this.closeConfirmModal();
        },
        error: (err) => {
          console.error(err);
          alert('Erreur lors de la suppression');
          this.closeConfirmModal();
        }
      });
    }
  }
}
