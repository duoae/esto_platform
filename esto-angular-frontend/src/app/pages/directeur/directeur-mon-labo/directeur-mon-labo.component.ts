import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-directeur-mon-labo',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './directeur-mon-labo.component.html'
})
export class DirecteurMonLaboComponent implements OnInit {
  lab: any = null;
  professeurs: any[] = [];
  doctorants: any[] = [];
  isLoading = true;
  isLoadingMembers = true;
  user: any = null;
  activeEquipeIndex: number = 0;
  
  // Edit Modal State
  isEditModalOpen = false;
  isSaving = false;
  editLabData: any = {
    nom: '',
    acronyme: '',
    etablissement: 'ESTO',
    locaux: '',
    director_name: '',
    director_email: '',
    director_title: '',
    director_phone: '',
    adjoint_name: '',
    adjoint_email: '',
    adjoint_title: '',
    adjoint_phone: '',
    equipes: []
  };
  thematiquesText: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    const userStr = localStorage.getItem('esto_user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      if (this.user.laboratoire_id) {
        this.loadLabDetails(this.user.laboratoire_id);
      } else {
        this.isLoading = false;
        this.isLoadingMembers = false;
      }
    } else {
      this.isLoading = false;
      this.isLoadingMembers = false;
    }
  }

  loadLabDetails(id: number) {
    this.apiService.getLab(id).subscribe({
      next: (res: any) => {
        this.lab = res.data || res;
        
        // Map backend objects to flat fields expected by the form
        if (this.lab.directeur) {
          this.lab.director_name = (this.lab.directeur.nom + ' ' + this.lab.directeur.prenom).trim();
          this.lab.director_email = this.lab.directeur.email;
          this.lab.director_title = this.lab.directeur.grade;
          this.lab.director_phone = this.lab.directeur.telephone;
        }

        if (this.lab.directeur_adjoint) {
          this.lab.adjoint_name = (this.lab.directeur_adjoint.nom + ' ' + this.lab.directeur_adjoint.prenom).trim();
          this.lab.adjoint_email = this.lab.directeur_adjoint.email;
          this.lab.adjoint_title = this.lab.directeur_adjoint.grade;
          this.lab.adjoint_phone = this.lab.directeur_adjoint.telephone;
        }

        // Fallback: If director details are not properly linked in the DB but the current user is the director
        if (!this.lab.director_name && this.user && (this.user.role === 'directeur' || this.user.role === 'Directeur')) {
          this.lab.director_name = (this.user.nom + ' ' + this.user.prenom).trim();
          this.lab.director_email = this.user.email;
          this.lab.director_title = this.user.details?.grade || this.user.grade || '';
          this.lab.director_phone = this.user.phone || this.user.telephone || '';
        }

        this.isLoading = false;
        this.loadLabMembers(id);
      },
      error: (err: any) => {
        console.error('Error loading lab details', err);
        this.isLoading = false;
      }
    });
  }

  loadLabMembers(id: number) {
    this.apiService.getLabMembers(id).subscribe({
      next: (res: any) => {
        const members = res.data || res;
        if (Array.isArray(members)) {
          this.professeurs = members.filter(m => m.role === 'professeur');
          this.doctorants = members.filter(m => m.role === 'candidat');
        }
        this.isLoadingMembers = false;
      },
      error: (err: any) => {
        console.error('Error loading lab members', err);
        this.isLoadingMembers = false;
      }
    });
  }

  get labInitials(): string {
    if (this.lab?.acronyme) return this.lab.acronyme;
    if (this.lab?.nom) return this.lab.nom.substring(0, 2).toUpperCase();
    return 'LB';
  }

  getMemberInitials(member: any): string {
    let initials = '';
    if (member?.nom) initials += member.nom.substring(0, 1);
    if (member?.prenom) initials += member.prenom.substring(0, 1);
    return initials ? initials.toUpperCase() : 'U';
  }

  openEditModal() {
    this.editLabData = JSON.parse(JSON.stringify(this.lab));
    if (!this.editLabData.equipes) this.editLabData.equipes = [];
    if (!this.editLabData.etablissement) this.editLabData.etablissement = 'ESTO';
    
    if (this.editLabData.thematiques && Array.isArray(this.editLabData.thematiques)) {
      this.thematiquesText = this.editLabData.thematiques.map((t: any) => typeof t === 'object' ? t.libelle : t).join('\n');
    } else {
      this.thematiquesText = '';
    }

    // Map axes back to text for equipes and fix thematique mapping
    this.editLabData.equipes.forEach((eq: any) => {
      // API returns thematique_equipe, map it to thematique for the form
      if (eq.thematique_equipe && !eq.thematique) {
        eq.thematique = eq.thematique_equipe;
      }
      if (eq.coordinateur_name && !eq.coordinateur) {
        eq.coordinateur = eq.coordinateur_name;
      }
      
      if (eq.axes && Array.isArray(eq.axes)) {
        eq.axesText = eq.axes.map((a: any) => typeof a === 'object' ? (a.libelle || a.nom) : a).join('\n');
      } else {
        eq.axesText = '';
      }
    });

    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  addEquipe() {
    if (!this.editLabData.equipes) {
      this.editLabData.equipes = [];
    }
    this.editLabData.equipes.push({
      nom: '', coordinateur: '', thematique: '', axesText: ''
    });
  }

  removeEquipe(index: number) {
    this.editLabData.equipes.splice(index, 1);
  }

  saveLabChanges() {
    if (!this.editLabData.nom || !this.editLabData.acronyme) {
      alert("Le nom et l'acronyme sont obligatoires.");
      return;
    }
    
    // Process thematiques
    const thematiquesArray = this.thematiquesText
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    this.editLabData.thematiques = thematiquesArray;

    // Process axes for equipes
    if (this.editLabData.equipes) {
      this.editLabData.equipes.forEach((eq: any) => {
        if (eq.axesText) {
          eq.axes = eq.axesText.split('\n').map((a: string) => a.trim()).filter((a: string) => a.length > 0);
        } else {
          eq.axes = [];
        }
      });
    }

    this.isSaving = true;
    this.apiService.updateLab(this.lab.id, this.editLabData).subscribe({
      next: (res: any) => {
        // Fetch fresh data from backend instead of local merge
        this.loadLabDetails(this.lab.id);
        this.isSaving = false;
        this.isEditModalOpen = false;
      },
      error: (err: any) => {
        console.error('Error updating lab', err);
        alert("Erreur lors de la sauvegarde. Vérifiez que tous les champs requis sont remplis et que l'acronyme est unique.");
        this.isSaving = false;
      }
    });
  }
}
