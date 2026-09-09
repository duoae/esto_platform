import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-candidat-mes-candidatures',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">État de ma candidature</h2>
          <p class="text-gray-500 mt-1">Suivez l'avancement de vos demandes et téléchargez vos convocations.</p>
        </div>
      </div>

      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-esto-primary"></div>
      </div>



      <div *ngIf="!isLoading && candidatures.length === 0" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-1">Aucune candidature</h3>
        <p class="text-gray-500">Vous n'avez pas encore postulé à des sujets de thèse.</p>
      </div>

      <div *ngIf="!isLoading && candidatures.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let cand of candidatures" 
             class="bg-white border p-6 rounded-lg hover:shadow-lg transition-shadow flex flex-col justify-between h-full group"
             [ngClass]="{
               'border-green-500 bg-green-50/30': cand.statut_choix === 'accepte' || cand.statut_choix === 'admis',
               'border-gray-200': cand.statut_choix !== 'accepte' && cand.statut_choix !== 'admis'
             }">
          
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">{{ cand.lab || 'Laboratoire' }}</span>
              <div class="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider"
                   [ngClass]="{
                     'text-yellow-600': cand.statut_choix === 'en_attente',
                     'text-blue-600': cand.statut_choix === 'pre_selectionne',
                     'text-green-600': cand.statut_choix === 'accepte' || cand.statut_choix === 'admis',
                     'text-red-600': cand.statut_choix === 'refuse'
                   }">
                <span *ngIf="cand.statut_choix === 'en_attente'" class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                <span *ngIf="cand.statut_choix === 'refuse'" class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <svg *ngIf="cand.statut_choix === 'pre_selectionne' || cand.statut_choix === 'accepte' || cand.statut_choix === 'admis'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span>{{ formatStatus(cand.statut_choix) }}</span>
              </div>
            </div>
            
            <h3 class="text-lg font-bold text-gray-900 leading-snug mb-3 line-clamp-3 transition-colors" [title]="cand.titre">
              {{ cand.titre }}
            </h3>
            
            <p class="text-sm text-gray-600 line-clamp-1 mb-4 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-bold">AN</span>
              Pr. Anonyme
            </p>
          </div>

          <div class="mt-4 pt-4 border-t" [ngClass]="(cand.statut_choix === 'accepte' || cand.statut_choix === 'admis') ? 'border-green-200' : 'border-gray-100'">
            <button *ngIf="cand.statut_choix === 'pre_selectionne'" (click)="telechargerConvocation(cand)" 
                    class="w-full flex justify-center items-center py-2.5 px-4 text-sm font-bold rounded transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Convocation (PDF)
            </button>
            <div *ngIf="cand.statut_choix !== 'pre_selectionne'" class="w-full text-center py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Aucune action requise
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Hidden element for PDF Generation -->
    <div style="display: none;">
      <div id="pdf-content" class="bg-white text-black p-8 font-sans w-[800px]">
        <!-- PDF content will be injected here -->
      </div>
    </div>
  `,
  styles: []
})
export class CandidatMesCandidaturesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8000/api';
  
  candidatures: any[] = [];
  notifications: any[] = [];
  isLoading = true;
  currentUser: any = null;
  printData: any = null;
  currentDate = new Date().toLocaleDateString('fr-FR');

  ngOnInit() {
    this.fetchCandidatures();
    this.fetchNotifications();
    this.fetchProfile();
  }

  fetchProfile() {
    this.http.get<any>(`${this.apiUrl}/candidat/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.currentUser = response.user;
      }
    });
  }

  fetchNotifications() {
    this.http.get<any>(`${this.apiUrl}/candidat/notifications`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.notifications = response.data || [];
      }
    });
  }

  fetchCandidatures() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/candidat/mes-choix`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        let items = response.data || [];
        
        const isAdmis = items.some((c: any) => c.statut_choix === 'admis');
        if (isAdmis) {
          this.router.navigate(['/candidat/suivi']);
          return;
        }

        // Sort by status priority
        items.sort((a: any, b: any) => {
          const getPriority = (status: string) => {
            if (status === 'admis' || status === 'accepte') return 1;
            if (status === 'pre_selectionne') return 2;
            if (status === 'en_attente') return 3;
            return 4;
          };
          return getPriority(a.statut_choix) - getPriority(b.statut_choix);
        });
        this.candidatures = items;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des choix:', err);
        this.isLoading = false;
      }
    });
  }

  formatStatus(status: string): string {
    const map: any = {
      'en_attente': 'En attente',
      'pre_selectionne': 'Pré-sélectionné',
      'accepte': 'Accepté',
      'admis': 'Admis',
      'refuse': 'Refusé'
    };
    return map[status] || status;
  }

  telechargerConvocation(cand: any) {
    const date = cand.convocation_date || 'À définir';
    const heure = cand.convocation_time || 'À définir';
    const lieu = cand.convocation_lieu || 'À définir';

    const htmlContent = `
      <div style="font-family: 'Times New Roman', Times, serif; padding: 20mm; color: #000; background: white; width: 210mm; height: 297mm; box-sizing: border-box; position: relative;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
          <div style="width: 60%;">
            <h1 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">Université Mohammed Premier</h1>
            <h2 style="font-size: 13px; font-weight: normal; margin: 0 0 4px 0;">École Supérieure de Technologie d'Oujda (ESTO)</h2>
            <p style="font-size: 10px; margin: 0;">Complexe Universitaire Al Qods, 60000 Oujda, Maroc</p>
          </div>
          <div style="width: 40%; text-align: right;">
            <p style="font-size: 12px; margin: 0 0 4px 0;">Oujda, le ${this.currentDate}</p>
            <p style="font-size: 10px; margin: 0;">Réf: ESTO/DOC/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}</p>
          </div>
        </div>

        <!-- Candidate Details (Right Aligned block but clean) -->
        <div style="margin-bottom: 30px; margin-left: 50%;">
          <p style="font-size: 13px; font-weight: bold; margin: 0 0 4px 0; text-decoration: underline;">À l'attention de :</p>
          <p style="font-size: 15px; font-weight: bold; margin: 0 0 4px 0; text-transform: uppercase;">M./Mme ${this.currentUser?.nom || ''} ${this.currentUser?.prenom || ''}</p>
          <p style="font-size: 13px; margin: 0 0 2px 0;">CIN : ${this.currentUser?.cin || 'Non renseigné'}</p>
          <p style="font-size: 13px; margin: 0;">Email : ${this.currentUser?.email || ''}</p>
        </div>

        <!-- Object -->
        <div style="margin-bottom: 30px;">
          <p style="font-size: 14px; font-weight: bold; margin: 0 0 6px 0;"><u>Objet</u> : Convocation à l'entretien de sélection au cycle doctoral</p>
          <p style="font-size: 13px; margin: 0 0 4px 0;"><b>Sujet de Thèse :</b> ${cand.titre}</p>
          <p style="font-size: 13px; margin: 0;"><b>Laboratoire d'accueil :</b> ${cand.lab || 'ESTO'}</p>
        </div>

        <!-- Title -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 18px; font-weight: bold; text-transform: uppercase; text-decoration: underline; margin: 0;">Avis de Convocation</h2>
        </div>

        <!-- Body -->
        <p style="margin-bottom: 15px; font-size: 14px;">Monsieur / Madame,</p>

        <p style="margin-bottom: 20px; text-align: justify; font-size: 14px; line-height: 1.5;">
          Suite à l'étude de votre dossier de candidature, nous avons l'honneur de vous informer que vous avez été présélectionné(e) pour passer l'entretien oral d'admission au cycle doctoral de notre établissement pour l'année universitaire en cours.
        </p>

        <!-- Exam Details -->
        <div style="margin: 0 0 30px 40px;">
          <p style="font-size: 14px; margin: 0 0 8px 0;">Vous êtes prié(e) de vous présenter selon le planning suivant :</p>
          <table style="width: 80%; font-size: 14px; margin-top: 10px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; width: 40%;"><b>Date de l'entretien :</b></td>
              <td style="padding: 4px 0;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><b>Heure de passage :</b></td>
              <td style="padding: 4px 0;">${heure}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><b>Lieu / Salle :</b></td>
              <td style="padding: 4px 0;">${lieu}</td>
            </tr>
          </table>
        </div>

        <!-- Instructions -->
        <div style="margin-bottom: 30px;">
          <p style="font-size: 14px; font-weight: bold; margin-bottom: 8px; text-decoration: underline;">Pièces obligatoires à fournir le jour de l'entretien :</p>
          <ul style="font-size: 13px; line-height: 1.5; margin-top: 0; padding-left: 20px;">
            <li>La présente convocation imprimée.</li>
            <li>Votre Carte d'Identité Nationale (CIN) originale.</li>
            <li>Une copie de votre projet de fin d'études (PFE) ou mémoire de Master.</li>
            <li>Tout document scientifique pertinent (attestations, publications éventuelles).</li>
          </ul>
        </div>

        <p style="font-size: 13px; text-align: justify; font-style: italic;">
          <b>NB :</b> Nous vous prions de vous présenter 30 minutes avant l'heure prévue. Toute absence ou retard entraînera l'annulation de votre candidature.
        </p>

        <!-- Footer / Signature Pinned to Bottom -->
        <div style="position: absolute; bottom: 30mm; right: 20mm; width: 60%; text-align: center;">
            <p style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">Le Directeur de l'ESTO</p>
            
            <!-- Simple Digital Stamp -->
            <div style="margin: 0 auto; width: 100px; height: 100px; border: 2px solid #000; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
               <p style="font-size: 10px; font-weight: bold; margin: 0; text-transform: uppercase;">Cachet Officiel</p>
               <p style="font-size: 9px; margin: 4px 0;">Direction ESTO</p>
               <p style="font-size: 8px; margin: 0;">${this.currentDate}</p>
            </div>
        </div>
        
      </div>
    `;

    const container = document.getElementById('pdf-content');
    if (container) {
      container.innerHTML = htmlContent;
      
      const options = {
        margin:       0, // Removed margin to let the content box fill the page properly
        filename:     `Convocation_${this.currentUser.nom}_${this.currentUser.prenom}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Ensure html2pdf is available
      const html2pdf = (window as any).html2pdf;
      if (html2pdf) {
        html2pdf().set(options).from(container).save();
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
          (window as any).html2pdf().set(options).from(container).save();
        };
        document.head.appendChild(script);
      }
    }
  }
}
