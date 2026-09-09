import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-candidat-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h2>
          <p class="text-gray-500 mt-1">Consultez vos messages et alertes concernant vos candidatures.</p>
        </div>
      </div>

      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-esto-primary"></div>
      </div>

      <div *ngIf="!isLoading && notifications.length === 0" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-1">Aucune notification</h3>
        <p class="text-gray-500">Vous n'avez pas de nouveaux messages pour le moment.</p>
      </div>

      <div *ngIf="!isLoading && notifications.length > 0" class="space-y-4">
        <div *ngFor="let notif of notifications" class="bg-white rounded-xl shadow-sm border p-6 flex gap-4 transition-all"
             [ngClass]="{
               'border-blue-200 bg-blue-50/30': notif.type === 'Convocation Entretien',
               'border-gray-200': notif.type !== 'Convocation Entretien'
             }">
          
          <div class="flex-shrink-0 mt-1">
            <!-- Icon for Convocation -->
            <div *ngIf="notif.type === 'Convocation Entretien'" class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <!-- Icon for others -->
            <div *ngIf="notif.type !== 'Convocation Entretien'" class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
          </div>

          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-lg font-bold text-gray-900" [ngClass]="{'text-blue-900': notif.type === 'Convocation Entretien'}">
                {{ notif.type }}
              </h4>
              <span class="text-xs text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                {{ notif.created_at | date:'dd/MM/yyyy HH:mm' }}
              </span>
            </div>
            <p class="text-gray-700 whitespace-pre-line leading-relaxed">{{ notif.message }}</p>
            
            <!-- Quick Link to candidatures if convocation -->
            <div *ngIf="notif.type === 'Convocation Entretien'" class="mt-4">
               <a href="/candidat/mes-candidatures" class="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                 Aller vers mes candidatures pour télécharger la convocation
                 <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
               </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class CandidatNotificationsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  notifications: any[] = [];
  isLoading = true;

  ngOnInit() {
    this.fetchNotifications();
  }

  fetchNotifications() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/candidat/notifications`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('esto_token')}` }
    }).subscribe({
      next: (response) => {
        this.notifications = response.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoading = false;
      }
    });
  }
}
