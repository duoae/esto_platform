import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  
  stats: any = null;
  isLoading = true;
  maxInscription = 1; // for calculating bar chart heights
  
  statusPercentages = { en_attente: 0, accepte: 0, admis: 0, refuse: 0 };
  totalCandidaturesStatus = 0;

  ngOnInit() {
    this.apiService.getDashboardStats().subscribe({
      next: (res: any) => {
        this.stats = res.data || res;
        
        // Calculate max value for the bar chart
        if (this.stats?.charts?.inscriptions_time) {
          const totals = this.stats.charts.inscriptions_time.map((i: any) => i.total);
          this.maxInscription = Math.max(...totals, 1); // Avoid division by zero
        }
        
        // Calculate status percentages for donut chart
        if (this.stats?.charts?.status) {
           const st = this.stats.charts.status;
           this.totalCandidaturesStatus = (st.en_attente || 0) + (st.accepte || 0) + (st.admis || 0) + (st.refuse || 0);
           if (this.totalCandidaturesStatus > 0) {
              this.statusPercentages = {
                 en_attente: Math.round(((st.en_attente || 0) / this.totalCandidaturesStatus) * 100),
                 accepte: Math.round(((st.accepte || 0) / this.totalCandidaturesStatus) * 100),
                 admis: Math.round(((st.admis || 0) / this.totalCandidaturesStatus) * 100),
                 refuse: Math.round(((st.refuse || 0) / this.totalCandidaturesStatus) * 100)
              };
           }
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }
  
  // Helper to format date for the timeline
  formatDate(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
  }

  // Helper for status badge colors
  getStatusClass(status: string) {
    switch (status) {
      case 'accepte': return 'bg-green-100 text-green-800';
      case 'refuse': return 'bg-red-100 text-red-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Helper for status names
  getStatusName(status: string) {
    switch (status) {
      case 'accepte': return 'Accepté';
      case 'refuse': return 'Refusé';
      case 'en_attente': return 'En attente';
      default: return status;
    }
  }
}
