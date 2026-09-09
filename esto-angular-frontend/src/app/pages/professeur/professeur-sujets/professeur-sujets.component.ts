import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-professeur-sujets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './professeur-sujets.component.html'
})
export class ProfesseurSujetsComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  
  private apiUrl = 'http://localhost:8000/api';

  sujetForm!: FormGroup;
  user: any = null;
  laboratoires: any[] = [];
  equipes: any[] = [];
  mySubjects: any[] = [];
  isAdding = false;
  isLoading = false;
  isSubmitting = false;
  canAddSujet = true;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    const userStr = localStorage.getItem('esto_user');
    if (userStr) {
      this.user = JSON.parse(userStr);
    }

    this.initForm();
    this.loadLaboratoires();
    if (this.user?.id) {
      this.loadMySubjects();
    }
  }

  initForm() {
    this.sujetForm = this.fb.group({
      titre: ['', Validators.required],
      pole_thematique: [''],
      axe_recherche: [''],
      objectif: [''],
      retombees: [''],
      conditions_accueil: [''],
      financement: [''],
      production_scientifique: [''],
      laboratoire_id: [this.user?.laboratoire_id || '', Validators.required],
      equipe_id: ['']
    });

    if (this.user?.laboratoire_id) {
      this.loadEquipes(this.user.laboratoire_id);
    }
  }

  loadLaboratoires() {
    this.http.get<any>(`${this.apiUrl}/labs`).subscribe({
      next: (res) => {
        const allLabs = res.data || res;
        if (this.user?.laboratoire_id) {
          this.laboratoires = allLabs.filter((lab: any) => lab.id == this.user.laboratoire_id);
        } else {
          this.laboratoires = allLabs;
        }
      },
      error: (err) => console.error('Erreur chargement laboratoires', err)
    });
  }

  loadMySubjects() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/subjects?enseignant_id=${this.user.id}`).subscribe({
      next: (res) => {
        this.mySubjects = res.data || res;
        this.canAddSujet = this.mySubjects.length < 2;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement sujets', err);
        this.isLoading = false;
      }
    });
  }

  toggleAdd() {
    this.isAdding = !this.isAdding;
    this.successMessage = '';
    this.errorMessage = '';
    if (this.isAdding) {
      this.sujetForm.reset({
        laboratoire_id: this.user?.laboratoire_id || ''
      });
    }
  }

  onLaboChange(event: any) {
    const labId = event.target.value;
    this.loadEquipes(labId);
  }

  loadEquipes(labId: any) {
    if (labId) {
      const selectedLab = this.laboratoires.find(l => l.id == labId);
      if (selectedLab && selectedLab.equipes) {
        this.equipes = selectedLab.equipes;
      } else {
        // Fetch if not eager loaded
        this.http.get<any>(`${this.apiUrl}/labs/${labId}`).subscribe(res => {
          this.equipes = res.data?.equipes || [];
        });
      }
    } else {
      this.equipes = [];
    }
  }

  onSubmit() {
    if (this.sujetForm.invalid) {
      this.sujetForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = this.sujetForm.value;
    const editingId = (this.sujetForm as any).editingId;

    const request = editingId 
      ? this.http.put(`${this.apiUrl}/subjects/${editingId}`, payload)
      : this.http.post(`${this.apiUrl}/subjects`, payload);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.sujetForm.reset({
          laboratoire_id: this.user?.laboratoire_id || ''
        });
        (this.sujetForm as any).editingId = null;
        this.toggleAdd();
        this.successMessage = editingId ? 'Le sujet a été modifié avec succès.' : 'Le sujet a été ajouté avec succès.';
        this.loadMySubjects();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Une erreur est survenue.';
      }
    });
  }

  // --- Modal Confirmation State ---
  showConfirmModal = false;
  sujetToConfirm: any = null;

  supprimerSujet(sujet: any) {
    this.sujetToConfirm = sujet;
    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.sujetToConfirm = null;
  }

  confirmActionExecute() {
    if (!this.sujetToConfirm) return;
    this.http.delete(`${this.apiUrl}/subjects/${this.sujetToConfirm.id}`).subscribe({
      next: () => {
        this.successMessage = 'Le sujet a été supprimé.';
        this.loadMySubjects();
        this.closeConfirmModal();
      },
      error: (err) => {
        console.error('Erreur suppression sujet', err);
        this.errorMessage = 'Erreur lors de la suppression du sujet.';
        this.closeConfirmModal();
      }
    });
  }

  editerSujet(sujet: any) {
    this.isAdding = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    // Set the form values
    this.sujetForm.patchValue({
      titre: sujet.title || sujet.titre,
      pole_thematique: sujet.pole || sujet.pole_thematique,
      axe_recherche: sujet.axe || sujet.axe_recherche,
      objectif: sujet.objective || sujet.objectif,
      retombees: sujet.retombees,
      conditions_accueil: sujet.conditions || sujet.conditions_accueil,
      financement: sujet.financement,
      production_scientifique: sujet.production_scientifique,
      laboratoire_id: sujet.laboratoire_id || this.user?.laboratoire_id,
      equipe_id: sujet.equipe_id
    });

    // Store the ID so we know we are editing
    (this.sujetForm as any).editingId = sujet.id;
  }
}
