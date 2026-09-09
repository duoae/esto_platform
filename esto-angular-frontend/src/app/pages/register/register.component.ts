import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  private apiUrl = 'http://localhost:8000/api';

  currentStep = 1;
  isLoading = false;
  errorMsg = '';

  nom = '';
  prenom = '';
  email = '';
  password = '';
  confirmPassword = '';
  telephone = '';
  cin = '';

  diplome = 'Master';
  laboratoire: any = '';
  laboratoires: any[] = [];
  cvFile: File | null = null;
  bacFile: File | null = null;
  bac2File: File | null = null;
  masterFile: File | null = null;
  licenceFile: File | null = null;

  ngOnInit() {
    this.fetchLaboratoires();
  }

  fetchLaboratoires() {
    this.http.get<any>(`${this.apiUrl}/labs`).subscribe({
      next: (response) => {
        this.laboratoires = response.data || [];
        if (this.laboratoires.length > 0) {
          this.laboratoire = this.laboratoires[0].id;
        }
      },
      error: (err) => console.error('Erreur chargement laboratoires:', err)
    });
  }

  nextStep() {
    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (!this.nom || !this.prenom || !this.email || !this.password || !this.telephone) {
      this.errorMsg = 'Veuillez remplir tous les champs.';
      return;
    }
    this.errorMsg = '';
    this.currentStep = 2;
  }

  previousStep() {
    this.currentStep = 1;
  }

  onFileChange(event: any, fileType: 'cv' | 'bac' | 'bac2' | 'master' | 'licence') {
    const file = event.target.files[0];
    if (file) {
      if (fileType === 'cv') this.cvFile = file;
      if (fileType === 'bac') this.bacFile = file;
      if (fileType === 'bac2') this.bac2File = file;
      if (fileType === 'master') this.masterFile = file;
      if (fileType === 'licence') this.licenceFile = file;
    }
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMsg = '';

    const formData = new FormData();
    formData.append('nom', this.nom);
    formData.append('prenom', this.prenom);
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('telephone', this.telephone);
    formData.append('cin', this.cin);
    formData.append('diplome_obtenu', this.diplome);
    if (!this.laboratoire) {
      this.errorMsg = 'Veuillez sélectionner un laboratoire.';
      this.isLoading = false;
      return;
    }
    formData.append('laboratoire_id', this.laboratoire.toString());

    if (this.cvFile) formData.append('cv', this.cvFile);
    if (this.bacFile) formData.append('bac', this.bacFile);
    if (this.bac2File) formData.append('bac2', this.bac2File);
    if (this.masterFile) formData.append('master', this.masterFile);
    if (this.licenceFile) formData.append('licence', this.licenceFile);

    this.authService.registerCandidat(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/candidat/mes-candidatures']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error?.errors) {
          const firstKey = Object.keys(err.error.errors)[0];
          this.errorMsg = `${firstKey.toUpperCase()}: ${err.error.errors[firstKey][0]}`;
        } else {
          this.errorMsg = err.error?.message || 'Erreur lors de l\'inscription.';
        }
      }
    });
  }
}