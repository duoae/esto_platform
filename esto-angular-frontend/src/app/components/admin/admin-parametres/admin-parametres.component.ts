import { Component, OnInit } from '@angular/core';
import { AdminSettingsService } from '../../../services/admin-settings.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-parametres.component.html'
})
export class AdminParametresComponent implements OnInit {
  parametres: any = {
    candidatures_ouvertes: '0',
    inscriptions_ouvertes: '0',
    annee_universitaire_courante: '',
    chatbot_active: '0',
    max_annees_doctorat: '3',
    email_contact_admin: ''
  };
  isLoading = false;

  constructor(
    private settingsService: AdminSettingsService
  ) {}

  ngOnInit(): void {
    this.loadParametres();
  }

  loadParametres() {
    this.isLoading = true;
    this.settingsService.getParametres().subscribe({
      next: (data: any) => {
        this.parametres = { ...this.parametres, ...data };
        this.isLoading = false;
      },
      error: (err: any) => {
        alert('Erreur lors du chargement des paramètres');
        this.isLoading = false;
      }
    });
  }

  save() {
    this.isLoading = true;
    this.settingsService.updateParametres(this.parametres).subscribe({
      next: (res: any) => {
        alert('Paramètres enregistrés avec succès !');
        this.isLoading = false;
      },
      error: (err: any) => {
        alert('Erreur lors de la sauvegarde');
        this.isLoading = false;
      }
    });
  }

  toggle(key: string) {
    this.parametres[key] = this.parametres[key] === '1' ? '0' : '1';
  }
}
