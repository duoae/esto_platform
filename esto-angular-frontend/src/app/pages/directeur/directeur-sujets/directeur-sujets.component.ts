import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-directeur-sujets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './directeur-sujets.component.html'
})
export class DirecteurSujetsComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private apiUrl = 'http://localhost:8000/api';

  user: any = null;
  sujets: any[] = [];
  searchTerm: string = '';
  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  statusFilter: string = 'all';

  editingSujet: any = null;
  editForm!: FormGroup;

  ngOnInit() {
    this.initForm();
    const userStr = localStorage.getItem('esto_user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      if (this.user.laboratoire_id) {
        this.loadSujets();
      }
    }
  }

  initForm() {
    this.editForm = this.fb.group({
      titre: ['', Validators.required],
      pole_thematique: [''],
      axe_recherche: [''],
      objectif: [''],
      retombees: [''],
      conditions_accueil: [''],
      financement: [''],
      production_scientifique: ['']
    });
  }

  loadSujets() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/subjects?lab=${this.user.laboratoire_id}`).subscribe({
      next: (res) => {
        this.sujets = res.data || res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement sujets', err);
        this.isLoading = false;
      }
    });
  }

  get filteredSujets() {
    let result = this.sujets;

    // Filter by status
    if (this.statusFilter !== 'all') {
      result = result.filter(sujet => {
        const s = (sujet.status || sujet.statut || '').toLowerCase();
        if (this.statusFilter === 'disponible') return s === 'disponible';
        if (this.statusFilter === 'indisponible') return s === 'indisponible';
        if (this.statusFilter === 'en attente') return s === 'en attente' || s === ''; // Handle empty/null as pending
        return true;
      });
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(sujet => {
        const title = (sujet.title || sujet.titre || '').toLowerCase();
        const prof = (sujet.proposer_name || (sujet.enseignant?.prenom + ' ' + sujet.enseignant?.nom) || '').toLowerCase();
        const date = (sujet.created_at || '').toLowerCase();
        return title.includes(term) || prof.includes(term) || date.includes(term);
      });
    }

    return result;
  }

  // --- Modal Confirmation State ---
  showConfirmModal = false;
  confirmAction: 'valider' | 'refuser' | null = null;
  sujetToConfirm: any = null;
  confirmMessage = '';

  validerSujet(sujet: any) {
    this.confirmAction = 'valider';
    this.sujetToConfirm = sujet;
    this.confirmMessage = 'Voulez-vous vraiment valider ce sujet ?';
    this.showConfirmModal = true;
  }

  refuserSujet(sujet: any) {
    this.confirmAction = 'refuser';
    this.sujetToConfirm = sujet;
    this.confirmMessage = 'Voulez-vous vraiment refuser ce sujet ?';
    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.confirmAction = null;
    this.sujetToConfirm = null;
  }

  viewingSujet: any = null;

  afficherDetails(sujet: any) {
    this.viewingSujet = sujet;
  }

  closeDetails() {
    this.viewingSujet = null;
  }

  confirmActionExecute() {
    if (this.confirmAction === 'valider') {
      this.executeValider(this.sujetToConfirm);
    } else if (this.confirmAction === 'refuser') {
      this.executeRefuser(this.sujetToConfirm);
    }
    this.closeConfirmModal();
  }

  private executeValider(sujet: any) {
    this.successMessage = '';
    this.errorMessage = '';

    const payload = { statut: 'disponible' };

    this.http.put(`${this.apiUrl}/subjects/${sujet.id}`, payload).subscribe({
      next: () => {
        this.successMessage = `Le sujet "${sujet.title || sujet.titre}" a été validé avec succès.`;
        sujet.statut = 'disponible';
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la validation.';
      }
    });
  }

  private executeRefuser(sujet: any) {
    this.successMessage = '';
    this.errorMessage = '';

    const payload = { statut: 'indisponible' };

    this.http.put(`${this.apiUrl}/subjects/${sujet.id}`, payload).subscribe({
      next: () => {
        this.successMessage = `Le sujet "${sujet.title || sujet.titre}" a été refusé.`;
        sujet.statut = 'indisponible';
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors du refus.';
      }
    });
  }

  editerSujet(sujet: any) {
    this.editingSujet = sujet;
    this.editForm.patchValue({
      titre: sujet.title || sujet.titre,
      pole_thematique: sujet.pole || sujet.pole_thematique,
      axe_recherche: sujet.axe || sujet.axe_recherche,
      objectif: sujet.objective || sujet.objectif,
      retombees: sujet.benefits || sujet.retombees,
      conditions_accueil: sujet.conditions || sujet.conditions_accueil,
      financement: sujet.funding || sujet.financement,
      production_scientifique: sujet.production || sujet.production_scientifique
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  annulerEdition() {
    this.editingSujet = null;
    this.editForm.reset();
  }

  sauvegarderEtValider() {
    if (this.editForm.invalid) return;
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = { 
      ...this.editForm.value,
      statut: 'disponible' // on valide en même temps
    };

    this.http.put(`${this.apiUrl}/subjects/${this.editingSujet.id}`, payload).subscribe({
      next: (res: any) => {
        this.successMessage = `Le sujet a été modifié et validé avec succès.`;
        // update local list
        const index = this.sujets.findIndex(s => s.id === this.editingSujet.id);
        if (index !== -1) {
          this.sujets[index] = res.data;
        }
        this.isSaving = false;
        this.annulerEdition();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la sauvegarde.';
        this.isSaving = false;
      }
    });
  }
}
